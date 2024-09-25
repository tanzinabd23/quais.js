import { bigIntAbs } from '../utils/maths.js';
import { AbstractCoinSelector, SelectedCoinsResult, SpendTarget } from './abstract-coinselector.js';
import { UTXO, denominate, denominations } from './utxo.js';

/**
 * The FewestCoinSelector class provides a coin selection algorithm that selects the fewest UTXOs required to meet the
 * target amount. This algorithm is useful for minimizing the size of the transaction and the fees associated with it.
 *
 * This class is a sub-class of {@link AbstractCoinSelector | **AbstractCoinSelector** } and implements the
 * {@link AbstractCoinSelector.performSelection | **performSelection** } method to provide the actual coin selection
 * logic.
 *
 * @category Transaction
 */
export class FewestCoinSelector extends AbstractCoinSelector {
    /**
     * The largest first coin selection algorithm.
     *
     * This algorithm selects the largest UTXOs first, and continues to select UTXOs until the target amount is reached.
     * If the total value of the selected UTXOs is greater than the target amount, the remaining value is returned as a
     * change output.
     *
     * @param {SpendTarget} target - The target amount to spend.
     * @returns {SelectedCoinsResult} The selected UTXOs and change outputs.
     */
    performSelection(target: SpendTarget): SelectedCoinsResult {
        this.validateTarget(target);
        this.validateUTXOs();

        const sortedUTXOs = this.sortUTXOsByDenomination(this.availableUTXOs, 'desc');

        let totalValue = BigInt(0);
        let selectedUTXOs: UTXO[] = [];

        // Get UTXOs that meets or exceeds the target value
        const UTXOsEqualOrGreaterThanTarget = sortedUTXOs.filter(
            (utxo) => utxo.denomination !== null && denominations[utxo.denomination] >= target.value,
        );

        if (UTXOsEqualOrGreaterThanTarget.length > 0) {
            // Find the smallest UTXO that meets or exceeds the target value
            const optimalUTXO = UTXOsEqualOrGreaterThanTarget.reduce((minDenominationUTXO, currentUTXO) => {
                if (currentUTXO.denomination === null) return minDenominationUTXO;
                return denominations[currentUTXO.denomination] < denominations[minDenominationUTXO.denomination!]
                    ? currentUTXO
                    : minDenominationUTXO;
            }, UTXOsEqualOrGreaterThanTarget[0]);

            selectedUTXOs.push(optimalUTXO);
            totalValue += denominations[optimalUTXO.denomination!];
        } else {
            // If no single UTXO meets or exceeds the target, aggregate smaller denominations
            // until the target is met/exceeded or there are no more UTXOs to aggregate
            while (sortedUTXOs.length > 0 && totalValue < target.value) {
                const nextOptimalUTXO = sortedUTXOs.reduce<UTXO>((closest, utxo) => {
                    if (utxo.denomination === null) return closest;

                    // Prioritize UTXOs that bring totalValue closer to target.value
                    const absThisDiff = bigIntAbs(target.value - (totalValue + denominations[utxo.denomination]));
                    const currentClosestDiff =
                        closest && closest.denomination !== null
                            ? bigIntAbs(target.value - (totalValue + denominations[closest.denomination]))
                            : BigInt(Infinity);

                    return absThisDiff < currentClosestDiff ? utxo : closest;
                }, sortedUTXOs[0]);

                // Add the selected UTXO to the selection and update totalValue
                selectedUTXOs.push(nextOptimalUTXO);
                totalValue += denominations[nextOptimalUTXO.denomination!];

                // Remove the selected UTXO from the list of available UTXOs
                const index = sortedUTXOs.findIndex(
                    (utxo) =>
                        utxo.denomination === nextOptimalUTXO.denomination && utxo.address === nextOptimalUTXO.address,
                );
                sortedUTXOs.splice(index, 1);
            }
        }

        // Replace the existing optimization code with this new implementation
        selectedUTXOs = this.sortUTXOsByDenomination(selectedUTXOs, 'desc');
        let runningTotal = totalValue;

        for (let i = selectedUTXOs.length - 1; i >= 0; i--) {
            const utxo = selectedUTXOs[i];
            if (utxo.denomination !== null && runningTotal - denominations[utxo.denomination] >= target.value) {
                runningTotal -= denominations[utxo.denomination];
                selectedUTXOs.splice(i, 1);
            } else {
                break;
            }
        }

        totalValue = runningTotal;

        // Ensure that selectedUTXOs contain all required properties
        const completeSelectedUTXOs = selectedUTXOs.map((utxo) => {
            const originalUTXO = this.availableUTXOs.find(
                (availableUTXO) =>
                    availableUTXO.denomination === utxo.denomination && availableUTXO.address === utxo.address,
            );
            if (!originalUTXO) {
                throw new Error('Selected UTXO not found in available UTXOs');
            }
            return originalUTXO;
        });

        // Check if the selected UTXOs meet or exceed the target amount
        if (totalValue < target.value) {
            throw new Error('Insufficient funds');
        }

        // Break down the total spend into properly denominatated UTXOs
        const spendDenominations = denominate(target.value);
        this.spendOutputs = spendDenominations.map((denomination) => {
            const utxo = new UTXO();
            utxo.denomination = denominations.indexOf(denomination);
            utxo.address = target.address;
            return utxo;
        });

        // Calculate change to be returned
        const change = totalValue - target.value;

        // If there's change, break it down into properly denominatated UTXOs
        if (change > BigInt(0)) {
            const changeDenominations = denominate(change);
            this.changeOutputs = changeDenominations.map((denomination) => {
                const utxo = new UTXO();
                utxo.denomination = denominations.indexOf(denomination);
                // We do not have access to change addresses here so leave it null
                return utxo;
            });
        } else {
            this.changeOutputs = [];
        }

        return {
            inputs: completeSelectedUTXOs,
            spendOutputs: this.spendOutputs,
            changeOutputs: this.changeOutputs,
        };
    }

    /**
     * Sorts UTXOs by their denomination.
     *
     * @param {UTXO[]} utxos - The UTXOs to sort.
     * @param {'asc' | 'desc'} direction - The direction to sort ('asc' for ascending, 'desc' for descending).
     * @returns {UTXO[]} The sorted UTXOs.
     */
    private sortUTXOsByDenomination(utxos: UTXO[], direction: 'asc' | 'desc'): UTXO[] {
        if (direction === 'asc') {
            return [...utxos].sort((a, b) => {
                const diff =
                    (a.denomination !== null ? denominations[a.denomination] : BigInt(0)) -
                    (b.denomination !== null ? denominations[b.denomination] : BigInt(0));
                return diff > 0 ? 1 : diff < 0 ? -1 : 0;
            });
        }
        return [...utxos].sort((a, b) => {
            const diff =
                (b.denomination !== null ? denominations[b.denomination] : BigInt(0)) -
                (a.denomination !== null ? denominations[a.denomination] : BigInt(0));
            return diff > 0 ? 1 : diff < 0 ? -1 : 0;
        });
    }

    /**
     * Validates the target amount.
     *
     * @param {SpendTarget} target - The target amount to validate.
     * @throws Will throw an error if the target amount is less than or equal to 0.
     */
    private validateTarget(target: SpendTarget) {
        if (target.value <= BigInt(0)) {
            throw new Error('Target amount must be greater than 0');
        }
    }

    /**
     * Validates the available UTXOs.
     *
     * @throws Will throw an error if there are no available UTXOs.
     */
    private validateUTXOs() {
        if (this.availableUTXOs.length === 0) {
            throw new Error('No UTXOs available');
        }
    }
}
