import * as anchor from "@anchor-lang/core"
import { Program } from "@anchor-lang/core"
import { Vault } from "../target/types/vault"
import {
    Commitment,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
} from "@solana/web3.js"

export const commitment: Commitment = "confirmed"
export const INITIAL_USER_LAMPORTS = 10 * LAMPORTS_PER_SOL

export const provider = anchor.AnchorProvider.env()

anchor.setProvider(provider)

export const program = anchor.workspace.vault as Program<Vault>

export const confirmTx = async (signature: string) => {
    const latestBlockhash = await provider.connection.getLatestBlockhash()

    await provider.connection.confirmTransaction(
        {
            signature,
            ...latestBlockhash,
        },
        commitment
    )
}

export const sendTransaction = async (user: Keypair, tx: Transaction) => {
    tx.feePayer = user.publicKey

    const latestBlockhash = await provider.connection.getLatestBlockhash()

    tx.recentBlockhash = latestBlockhash.blockhash

    tx.sign(user)

    const signature = await provider.connection.sendRawTransaction(
        tx.serialize(),
        { skipPreflight: false, preflightCommitment: commitment }
    )

    await confirmTx(signature)

    return signature
}

export const setup = async () => {
    const user = Keypair.generate()

    const userAirdrop = await provider.connection.requestAirdrop(
        user.publicKey,
        INITIAL_USER_LAMPORTS
    )

    await confirmTx(userAirdrop)

    return user
}