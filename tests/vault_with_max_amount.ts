import { describe, it, beforeAll, expect } from "vitest"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import BN from "bn.js"
import { program, provider, setup, sendTransaction } from "./utils"

describe("vault with max amount", () => {
    let user: Keypair
    let vaultStatePda: PublicKey
    let vaultPda: PublicKey
    let stateBump: number
    let vaultBump: number

    let userStartingBalance: number
    let userBalanceAfterInitialize: number
    let userBalanceAfterWithdraw: number

    const maxAmount = 1_000_000_000

    beforeAll(async () => {
        user = await setup()
        ;[vaultStatePda, stateBump] = PublicKey.findProgramAddressSync(
            [Buffer.from("state"), user.publicKey.toBuffer()],
            program.programId
        )
        ;[vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), vaultStatePda.toBuffer()],
            program.programId
        )
    })

    it("initializes vault with a max amount", async () => {
        userStartingBalance = await provider.connection.getBalance(
            user.publicKey
        )

        const tx = await program.methods
            .initialize(new BN(maxAmount))
            .accountsStrict({
                user: user.publicKey,
                vaultState: vaultStatePda,
                vault: vaultPda,
                systemProgram: SystemProgram.programId,
            })
            .transaction()

        await sendTransaction(user, tx)

        const vaultStateAccount =
            await program.account.vaultState.fetch(vaultStatePda)

        expect(vaultStateAccount.vaultBump).toBe(vaultBump)
        expect(vaultStateAccount.stateBump).toBe(stateBump)
        expect(vaultStateAccount.maxAmount?.toNumber()).toBe(maxAmount)

        userBalanceAfterInitialize = await provider.connection.getBalance(
            user.publicKey
        )

        expect(userBalanceAfterInitialize).toBeLessThan(userStartingBalance)
    })

    it("allows a deposit below the max amount", async () => {
        const depositAmount = new BN(600_000_000)

        const tx = await program.methods
            .deposit(depositAmount)
            .accountsStrict({
                user: user.publicKey,
                vaultState: vaultStatePda,
                vault: vaultPda,
                systemProgram: SystemProgram.programId,
            })
            .transaction()

        await sendTransaction(user, tx)

        const vaultBalance = await provider.connection.getBalance(vaultPda)

        expect(vaultBalance).toBe(depositAmount.toNumber())
        expect(
            await provider.connection.getBalance(user.publicKey)
        ).toBeLessThan(userBalanceAfterInitialize - depositAmount.toNumber())
    })

    it("withdraws from vault", async () => {
        const depositAmount = new BN(600_000_000)
        const withdrawAmount = new BN(200_000_000)

        const tx = await program.methods
            .withdraw(withdrawAmount)
            .accountsStrict({
                user: user.publicKey,
                vaultState: vaultStatePda,
                vault: vaultPda,
                systemProgram: SystemProgram.programId,
            })
            .transaction()

        await sendTransaction(user, tx)

        const vaultBalance = await provider.connection.getBalance(vaultPda)
        userBalanceAfterWithdraw = await provider.connection.getBalance(
            user.publicKey
        )

        expect(vaultBalance).toBe(
            depositAmount.toNumber() - withdrawAmount.toNumber()
        )
        expect(userBalanceAfterWithdraw).toBeLessThan(
            userBalanceAfterInitialize -
                depositAmount.toNumber() +
                withdrawAmount.toNumber()
        )
    })

    it("closes vault", async () => {
        const vaultStateBalanceBeforeClose =
            await provider.connection.getBalance(vaultStatePda)
        const vaultBalanceBeforeClose =
            await provider.connection.getBalance(vaultPda)

        const tx = await program.methods
            .close()
            .accountsStrict({
                user: user.publicKey,
                vaultState: vaultStatePda,
                vault: vaultPda,
                systemProgram: SystemProgram.programId,
            })
            .transaction()

        await sendTransaction(user, tx)

        expect(await provider.connection.getBalance(vaultPda)).toBe(0)
        const closedAccount = await provider.connection.getAccountInfo(vaultStatePda)
expect(closedAccount === null || closedAccount.lamports === 0).toBe(true)
        expect(
            await provider.connection.getBalance(user.publicKey)
        ).toBeLessThan(
            userBalanceAfterWithdraw +
                vaultStateBalanceBeforeClose +
                vaultBalanceBeforeClose
        )
    })

    it("rejects deposits above the max amount", async () => {
        const failingUser = await setup()

        const [failingVaultStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("state"), failingUser.publicKey.toBuffer()],
            program.programId
        )

        const [failingVaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), failingVaultStatePda.toBuffer()],
            program.programId
        )

        const initializeTx = await program.methods
            .initialize(new BN(maxAmount))
            .accountsStrict({
                user: failingUser.publicKey,
                vaultState: failingVaultStatePda,
                vault: failingVaultPda,
                systemProgram: SystemProgram.programId,
            })
            .transaction()

        await sendTransaction(failingUser, initializeTx)

        const depositTx = await program.methods
            .deposit(new BN(maxAmount + 1))
            .accountsStrict({
                user: failingUser.publicKey,
                vaultState: failingVaultStatePda,
                vault: failingVaultPda,
                systemProgram: SystemProgram.programId,
            })
            .transaction()

        let thrownError: unknown

        try {
            await sendTransaction(failingUser, depositTx)
        } catch (error) {
            thrownError = error
        }

        expect(thrownError).toBeDefined()
        expect(String(thrownError)).toContain("DepositExceedsMax")
    })
})