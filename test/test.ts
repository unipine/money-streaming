import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BigNumber, ContractTransaction, ContractReceipt } from 'ethers'
import '@nomiclabs/hardhat-ethers'

import { Payment__factory } from '../build/types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { getContractFactory, getSigners } = ethers

describe('Payment', async () => {
  let payment
  let signers: SignerWithAddress[]
  let streamingTime: number = 60 * 60 * 24 * 30

  before(async () => {
    signers = await getSigners()

    // Deploy the payment smart contract to the net
    const paymentFactory = (await getContractFactory('Payment', signers[1])) as Payment__factory
    payment = await paymentFactory.deploy()
    await payment.deployed()

    // Check deployment result
    expect(await payment.name()).to.eq("ETH & ERC20 Payments")
  })

  it('Deposit Benefit Amount', async () => {
    // Deposit Ether into the contract for benefit splitting and check the triggered event
    await expect(payment.connect(signers[1]).depositBenefitAmount({ value: ethers.utils.parseEther("1") }))
      .to.emit(payment, "DepositBenefitAmount")
      .withArgs(getBigNumber(1, 18))

    // Check changed variables
    expect(await ethers.provider.getBalance(payment.address)).to.eq(getBigNumber(1, 18))
    expect(await payment.benefitAmount()).to.eq(getBigNumber(1, 18))
  })

  it('Set Streaming Time', async () => {
    // Set streaming time
    await payment.setStreamingTime(streamingTime);

    // Check streamingTime
    expect(await payment.streamingTime()).to.eq(streamingTime)
  })

  it('Shares: First User', async () => {
    // Add new Shares to first user
    await payment.addNewShares(3, signers[2].address)

    // Check AddNewShares event and the result
    const receipt = await payment.connect(signers[2]).getShareData()
    expect(receipt[0]).to.eq(3)
  })

  it('Shares: Second User', async () => {
    // Add new Shares to second user
    await payment.addNewShares(7, signers[3].address)

    // Check AddNewShares event and the result
    const receipt = await payment.connect(signers[3]).getShareData()
    expect(receipt[0]).to.eq(7)
  })

  it('Withdraw: First User', async () => {
    // Withdraw the first user's benefit
    const transaction: ContractTransaction = await payment.connect(signers[2]).withdraw()
    const receipt: ContractReceipt = await transaction.wait()

    // Check the result and withdraw by user who has no share
    expect(receipt.events[0].event).to.eq("Withdraw")
    expect(receipt.events[0].args.user).to.eq(signers[2].address)
    expect(receipt.events[0].args.totalAmount).to.eq(getBigNumber(3, 17))
    expect(receipt.events[0].args.possibleAmount).to.eq(
      Math.floor(
        parseInt(getBigNumber(3, 17).toString()) *
        (receipt.events[0].args.currentWithdrawTime - receipt.events[0].args.lastWithdrawTime) /
        streamingTime
      )
      .toString()
    )
  })

  it('Withdraw: Second User', async () => {
    // Withdraw the second user's benefit
    const transaction: ContractTransaction = await payment.connect(signers[3]).withdraw()
    const receipt: ContractReceipt = await transaction.wait()

    // Check the result and withdraw by user who has no share
    expect(receipt.events[0].event).to.eq("Withdraw")
    expect(receipt.events[0].args.user).to.eq(signers[3].address)
    expect(receipt.events[0].args.totalAmount).to.eq(getBigNumber(7, 17))
    expect(receipt.events[0].args.possibleAmount).to.eq(
      Math.floor(
        parseInt(getBigNumber(7, 17).toString()) *
        (receipt.events[0].args.currentWithdrawTime - receipt.events[0].args.lastWithdrawTime) /
        streamingTime
      )
      .toString()
    )
  })
})

function getBigNumber(amount: number, indice: number) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(indice))
}
