const { ethers } = require("hardhat")
const hre = require('hardhat');
const chai = require('chai');
const expect = chai.expect;

const TOTAL_SUPPLY = 100000000
const NAME = 'Brewery Token'
const SYMBOL = 'BRE'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const INITIAL_SUPPLY = ethers.utils.parseEther(TOTAL_SUPPLY.toString())
const transferAmount = ethers.utils.parseEther("10")
const unitTokenAmount = ethers.utils.parseEther("1")

const overdraftAmount = INITIAL_SUPPLY.add(unitTokenAmount)
const overdraftAmountMinusOne = overdraftAmount.sub(unitTokenAmount)
const transferAmountMinusOne = transferAmount.sub(unitTokenAmount)

let breToken, owner, ownerAddr, anotherAccount, anotherAccountAddr, recipient, recipientAddr, r

async function awaitTx(tx) {
    return await (await tx).wait()
}

async function isEthException(promise) {
    let msg = 'No Exception';
    try {
        let x = await promise
        // if (!!x.wait) {
        //     await x.wait()
        // }
    } catch (e) {
        msg = e.message
    }
    return (
        msg.includes('Transaction reverted') ||
        msg.includes('VM Exception while processing transaction: revert') ||
        msg.includes('invalid opcode') ||
        msg.includes('exited with an error (status 0)')
    )
}

async function setupContractAndAccounts () {
    let accounts = await ethers.getSigners()
    owner = accounts[0]
    ownerAddr = await owner.getAddress()
    anotherAccount = accounts[1]
    anotherAccountAddr = await anotherAccount.getAddress()
    recipient = accounts[2]
    recipientAddr = await recipient.getAddress()

    const BreTokenFactory = await hre.ethers.getContractFactory("BreToken");
    breToken = await BreTokenFactory.deploy(
        NAME,
        SYMBOL,
        INITIAL_SUPPLY,
        18
    );
    await breToken.deployed()
    breToken = breToken.connect(owner)
}

describe('breToken:ERC20', () => {
    before('setup breToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('name', () => {
        it('returns token name', async () => {
            expect(await breToken.name()).to.equal(NAME)
        })
    })

    describe('symbol', () => {
        it('returns token symbol', async () => {
            expect(await breToken.symbol()).to.equal(SYMBOL)
        })
    })

    describe('decimals', () => {
        it('returns token decimals', async () => {
            expect(await breToken.decimals()).to.equal(18)
        })
    })

    describe('totalSupply', () => {
        it('returns the total amount of tokens', async () => {
            expect(await breToken.totalSupply()).to.equal(INITIAL_SUPPLY)
        })
    })

    describe('balanceOf', () => {
        describe('when the requested account has no tokens', () => {
            it('returns zero', async () => {
                expect(await breToken.balanceOf(anotherAccountAddr)).to.equal(0)
            })
        })

        describe('when the requested account has some tokens', () => {
            it('returns the total amount of tokens', async () => {
                expect(await breToken.balanceOf(ownerAddr)).to.equal(INITIAL_SUPPLY)
            })
        })
    })

    describe('burn', () => {
        it('should not burn more than account balance', async () => {
            let oldBalance = await breToken.balanceOf(ownerAddr)
            await expect(breToken.burn(oldBalance.add(unitTokenAmount))).to.be.revertedWith("ERC20: burn amount exceeds balance")
        })

        it('burn tokens', async () => {
            let oldBalance = await breToken.balanceOf(ownerAddr)
            await breToken.burn(unitTokenAmount);
            let newBalance = await breToken.balanceOf(ownerAddr)
            expect(newBalance.add(unitTokenAmount)).to.be.equal(oldBalance)
            let totalSupply = await breToken.totalSupply();
            expect(totalSupply.add(unitTokenAmount)).to.be.equal(INITIAL_SUPPLY)
        })
    })
})

describe('breToken:ERC20:transfer', () => {
    before('setup breToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the sender is invalid address', () => {
        it('reverts', async () => {
            expect(
                await isEthException(breToken.transfer(ZERO_ADDRESS, overdraftAmount))
            ).to.be.true
        })
    })

    describe('when the sender does NOT have enough balance', () => {
        it('reverts', async () => {
            expect(
                await isEthException(breToken.transfer(recipientAddr, overdraftAmount))
            ).to.be.true
        })
    })

    describe('when the sender has enough balance', () => {
        before(async () => {
            r = await awaitTx(breToken.transfer(recipientAddr, transferAmount))
        })

        it('should transfer the requested amount', async () => {
            const senderBalance = await breToken.balanceOf(ownerAddr)
            const recipientBalance = await breToken.balanceOf(recipientAddr)
            const supply = await breToken.totalSupply()
            expect(supply.sub(transferAmount)).to.equal(senderBalance)
            expect(recipientBalance).to.equal(transferAmount)
        })
        it('should emit a transfer event', async () => {
            expect(r.events.length).to.equal(1)
            expect(r.events[0].event).to.equal('Transfer')
            expect(r.events[0].args.from).to.equal(ownerAddr)
            expect(r.events[0].args.to).to.equal(recipientAddr)
            expect(r.events[0].args.value).to.equal(transferAmount)
        })
    })

    describe('when the recipient is the zero address', () => {
        it('should fail', async () => {
            expect(
                await isEthException(breToken.transfer(ZERO_ADDRESS, transferAmount))
            ).to.be.true
        })
    })
})

describe('breToken:ERC20:transferFrom', () => {
    before('setup breToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the spender does NOT have enough approved balance', () => {
        describe('when the owner does NOT have enough balance', () => {
            it('reverts', async () => {
                await awaitTx(breToken.approve(anotherAccountAddr, overdraftAmountMinusOne))
                expect(
                    await isEthException(breToken.connect(anotherAccount).transferFrom(ownerAddr, recipientAddr, overdraftAmount))
                ).to.be.true
            })
        })

        describe('when the owner has enough balance', () => {
            it('reverts', async () => {
                await awaitTx(breToken.approve(anotherAccountAddr, transferAmountMinusOne))
                expect(
                    await isEthException(breToken.connect(anotherAccount).transferFrom(ownerAddr, recipientAddr, transferAmount))
                ).to.be.true
            })
        })
    })

    describe('when the spender has enough approved balance', () => {
        describe('when the owner does NOT have enough balance', () => {
            it('should fail', async () => {
                await awaitTx(breToken.approve(anotherAccountAddr, overdraftAmount))
                expect(
                    await isEthException(breToken.connect(anotherAccount).transferFrom(ownerAddr, recipientAddr, overdraftAmount))
                ).to.be.true
            })
        })

        describe('when the owner has enough balance', () => {
            let prevSenderBalance, r

            before(async () => {
                prevSenderBalance = await breToken.balanceOf(ownerAddr)
                await breToken.approve(anotherAccountAddr, transferAmount)
                r = await (await breToken.connect(anotherAccount).transferFrom(ownerAddr, recipientAddr, transferAmount)).wait()
            });


            it('emits a transfer event', async () => {
                expect(r.events.length).to.be.equal(2);
                expect(r.events[0].event).to.equal('Transfer')
                expect(r.events[0].args.from).to.equal(ownerAddr)
                expect(r.events[0].args.to).to.equal(recipientAddr)
                expect(r.events[0].args.value).to.equal(transferAmount)
            });

            it('transfers the requested amount', async () => {
                const senderBalance = await breToken.balanceOf(ownerAddr)
                const recipientBalance = await breToken.balanceOf(recipientAddr)
                expect(prevSenderBalance.sub(transferAmount)).to.equal(senderBalance)
                expect(recipientBalance).to.equal(transferAmount)
            })

            it('decreases the spender allowance', async () => {
                expect((await breToken.allowance(ownerAddr, anotherAccountAddr)).eq(0)).to.be.true
            })

        })
    })
})

describe('breToken:ERC20:approve', () => {
    before('setup breToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the spender is NOT the zero address', () => {
        describe('when the sender has enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    await awaitTx(breToken.approve(anotherAccountAddr, 0))
                    r = await awaitTx(breToken.approve(anotherAccountAddr, transferAmount))
                })

                it('approves the requested amount', async () => {
                    expect(await breToken.allowance(ownerAddr, anotherAccountAddr)).to.equal(transferAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    expect(r.events[0].args.value).to.equal(transferAmount)
                })
            })

            describe('when the spender had an approved amount', () => {
                before(async () => {
                    await awaitTx(breToken.approve(anotherAccountAddr, ethers.utils.parseEther("1")))
                    r = await awaitTx(breToken.approve(anotherAccountAddr, transferAmount))
                })

                it('approves the requested amount and replaces the previous one', async () => {
                    expect(await breToken.allowance(ownerAddr, anotherAccountAddr)).to.equal(transferAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    expect(r.events[0].args.value).to.equal(transferAmount)
                })
            })
        })

        describe('when the sender does not have enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    await breToken.approve(anotherAccountAddr, 0)
                    r = await (await breToken.approve(anotherAccountAddr, overdraftAmount)).wait()
                })

                it('approves the requested amount', async () => {
                    expect(await breToken.allowance(ownerAddr, anotherAccountAddr)).to.equal(overdraftAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    expect(r.events[0].args.value).to.equal(overdraftAmount)
                })
            })

            describe('when the spender had an approved amount', () => {
                before(async () => {
                    await breToken.approve(anotherAccountAddr, ethers.utils.parseEther("1"))
                    r = await (await breToken.approve(anotherAccountAddr, overdraftAmount)).wait()
                })

                it('approves the requested amount', async () => {
                    expect(await breToken.allowance(ownerAddr, anotherAccountAddr)).to.equal(overdraftAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    expect(r.events[0].args.value).to.equal(overdraftAmount)
                })
            })
        })
    })
})

describe('breToken:ERC20:decreaseAllowance', () => {
    before('setup breToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the spender is NOT the zero address', () => {
        describe('when the sender has enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    await breToken.approve(anotherAccountAddr, transferAmount)
                    r = await (await breToken.decreaseAllowance(anotherAccountAddr, unitTokenAmount)).wait()
                })

                it('should not decrease allowance more than current allowance', async () => {
                    let currentAllowance = await breToken.allowance(ownerAddr, anotherAccountAddr);
                    await expect(breToken.decreaseAllowance(anotherAccountAddr, currentAllowance.add(unitTokenAmount))).to.be.revertedWith("ERC20: decreased allowance below zero")
                })

                it('approves the requested amount', async () => {
                    expect(await breToken.allowance(ownerAddr, anotherAccountAddr)).to.equal(transferAmountMinusOne)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    expect(r.events[0].args.value).to.equal(transferAmountMinusOne)
                })
            })
        })
    })
});
