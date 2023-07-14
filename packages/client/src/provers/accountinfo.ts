import { ethers, utils as ethersUtils } from 'ethers'

import { EphemeralProverImpl, ProofData } from './prover'
import { RelicClient } from '../client'

import { InvalidArgument, utils } from '../'

export enum InfoType {
    StorageRoot,
    CodeHash,
    Balance,
    Nonce,
    RawHeader
}

export interface AccountInfoParams {
    block: ethers.providers.BlockTag
    account: string
    info: InfoType
}

export class AccountInfoProver extends EphemeralProverImpl<AccountInfoParams> {
    constructor(client: RelicClient) {
        super(client, 'accountInfoProver')
    }

    override async getProofData(params: AccountInfoParams): Promise<ProofData> {
        const proof = await this.client.api.accountProof(
            params.block,
            params.account
        )

        const proofData = ethersUtils.defaultAbiCoder.encode(
            ['address', 'bytes', 'bytes', 'bytes', 'uint256'],
            [
                proof.account,
                proof.accountProof,
                proof.header,
                proof.blockProof,
                params.info,
            ]
        )

        var sigData: string;
        switch (params.info) {
            case InfoType.StorageRoot:
                sigData = utils.accountStorageSigData(proof.blockNum, proof.storageHash);
                break;
            case InfoType.CodeHash:
                sigData = utils.accountCodeHashSigData(proof.blockNum, proof.codeHash);
                break;
            case InfoType.Balance:
                sigData = utils.accountBalanceSigData(proof.blockNum);
                break;
            case InfoType.Nonce:
                sigData = utils.accountNonceSigData(proof.blockNum);
                break;
            case InfoType.RawHeader:
                sigData = utils.accountSigData(proof.blockNum);
                break;
            default:
                throw new InvalidArgument();
        }

        return {
            proof: proofData,
            sigData: sigData,
        }
    }
}
