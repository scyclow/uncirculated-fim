
const { expect } = require("chai")

const expectFailure = async (fn, err) => {
  let failure
  try {
    await fn()
  } catch (e) {
    failure = e
  }
  expect(failure.message).to.include(err)
}

const num = n => Number(ethers.utils.formatEther(n))

describe('UncirculatedFakeInternetMoney', () => {
  it('should work', async () => {
    const [owner, buyer1, buyer2] = await ethers.getSigners()

    const UncirculatedFactory = await ethers.getContractFactory('UncirculatedFakeInternetMoney', owner)
    Uncirculated = await UncirculatedFactory.deploy()
    await Uncirculated.deployed()
    await Uncirculated.connect(owner).mint(owner.address, 0)
    await Uncirculated.connect(owner).mint(owner.address, 20)
    await Uncirculated.connect(owner).mint(owner.address, 21)
    await Uncirculated.connect(owner).mint(owner.address, 22)
    await Uncirculated.connect(owner).mint(owner.address, 23)
    await Uncirculated.connect(owner).mint(owner.address, 24)

    const TokenURIFactory = await ethers.getContractFactory('TokenURI', owner)
    const TokenURI = await TokenURIFactory.deploy(Uncirculated.address)
    await TokenURI.deployed()


    const MinterFactory = await ethers.getContractFactory('Minter', owner)
    Minter = await MinterFactory.deploy(Uncirculated.address)
    await Minter.deployed()

    // await Minter.connect(owner).flipIsLocked()


    await Uncirculated.connect(owner).setTokenURIContract(TokenURI.address)
    await Uncirculated.connect(owner).setMintingAddress(Minter.address)

    const baseMetadata = {
      baseImgUrl: 'ipfs://abcd/',
      imgExtension: '.jpeg',
      baseExternalUrl: 'https://uncirculatedmoney.com/',
      license: 'CC BY-NC 4.0',
      description: 'Uncirculated FIM'
    }
    await TokenURI.connect(owner).setBaseMetadata(
      baseMetadata.baseImgUrl,
      baseMetadata.imgExtension,
      baseMetadata.baseExternalUrl,
      baseMetadata.license,
      baseMetadata.description,
    )

    const startingOwnerBalance = num(await owner.getBalance())

    await Minter.connect(buyer1).mint(1, {
      value: ethers.utils.parseEther('0.0995')
    })
    await Minter.connect(buyer2).mint(2, {
      value: ethers.utils.parseEther('0.0995')
    })

    expect(await Uncirculated.connect(owner).ownerOf(1)).to.equal(buyer1.address)
    expect(await Uncirculated.connect(owner).ownerOf(2)).to.equal(buyer2.address)

    await expectFailure(() =>
      Minter.connect(buyer2).withdraw(),
      'Ownable:'
    )

    await Minter.connect(owner).withdraw()

    const endingOwnerBalance = num(await owner.getBalance())

    expect(endingOwnerBalance - startingOwnerBalance).to.be.closeTo(0.0995*2, 0.001)

  })
})