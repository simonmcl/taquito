import { OperationContentsAndResult, OperationContentsAndResultOrigination } from '@taquito/rpc';
import { Context } from '../context';
import { DefaultContractType } from '../contract/contract';
import { RpcContractProvider } from '../contract/rpc-contract-provider';
import { OriginationOperationError } from './operation-errors';
import { Operation } from './operations';
import {
  FeeConsumingOperation,
  ForgedBytes,
  GasConsumingOperation,
  hasMetadataWithResult,
  RPCOriginationOperation,
  StorageConsumingOperation,
} from './types';

/**
 * @description Origination operation provide utility function to fetch newly originated contract
 *
 * @warn Currently support only one origination per operation
 */
export class OriginationOperation<TContract extends DefaultContractType = DefaultContractType>
  extends Operation
  implements GasConsumingOperation, StorageConsumingOperation, FeeConsumingOperation
{
  /**
   * @description Contract address of the newly originated contract
   */
  public readonly contractAddress?: string;

  constructor(
    hash: string,
    private readonly params: RPCOriginationOperation,
    raw: ForgedBytes,
    results: OperationContentsAndResult[],
    context: Context,
    private contractProvider: RpcContractProvider
  ) {
    super(hash, raw, results, context);

    const originatedContracts = this.operationResults && this.operationResults.originated_contracts;
    if (Array.isArray(originatedContracts)) {
      this.contractAddress = originatedContracts[0];
    }
  }

  get status() {
    const operationResults = this.operationResults;
    if (operationResults) {
      return operationResults.status;
    } else {
      return 'unknown';
    }
  }

  get operationResults() {
    const originationOp =
      Array.isArray(this.results) &&
      (this.results.find((op) => op.kind === 'origination') as
        | OperationContentsAndResultOrigination
        | undefined);

    const result =
      originationOp &&
      hasMetadataWithResult(originationOp) &&
      originationOp.metadata.operation_result;
    return result ? result : undefined;
  }

  get fee() {
    return this.params.fee;
  }

  get gasLimit() {
    return this.params.gas_limit;
  }

  get storageLimit() {
    return this.params.storage_limit;
  }

  get consumedGas() {
    const consumedGas = this.operationResults && this.operationResults.consumed_gas;
    return consumedGas ? consumedGas : undefined;
  }

  get storageDiff() {
    const storageDiff = this.operationResults && this.operationResults.paid_storage_size_diff;
    return storageDiff ? storageDiff : undefined;
  }

  get storageSize() {
    const storageSize = this.operationResults && this.operationResults.storage_size;
    return storageSize ? storageSize : undefined;
  }

  get errors() {
    return this.operationResults && this.operationResults.errors;
  }

  /**
   * @description Provide the contract abstract of the newly originated contract
   */
  async contract(confirmations?: number, timeout?: number) {
    if (!this.contractAddress) {
      throw new OriginationOperationError('No contract was originated in this operation');
    }

    await this.confirmation(confirmations, timeout);
    return this.contractProvider.at<TContract>(this.contractAddress);
  }
}
