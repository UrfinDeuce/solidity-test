import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { type MyERC20 } from '../typechain-types/contracts/MyERC20';
import { type SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const PRICE = ethers.BigNumber.from(1000000000);
const AMOUNT = ethers.BigNumber.from(1000);
const NAME = 'MyToken';
const SYMBOL = 'MTK';

describe('MyERC20', function () {
  async function deployContractsFixture(): Promise<{
    token: MyERC20;
    user: SignerWithAddress;
    from: SignerWithAddress;
    to: SignerWithAddress;
    owner: SignerWithAddress;
    spender: SignerWithAddress;
  }> {
    const MyERC20 = await ethers.getContractFactory('MyERC20');
    const token = await MyERC20.deploy(NAME, SYMBOL, PRICE);
    const [owner, spender, user, from, to] = await ethers.getSigners();

    return { token, user, from, to, owner, spender };
  }
  describe('Deploy', function () {
    it('Should deploy with proper address', async function () {
      const { token } = await loadFixture(deployContractsFixture);
      // console.log(token.address);
      const tokenAddress = token.address;

      expect(token.address).to.be.equal(tokenAddress);
    });

    it('Should deploy with right name', async function () {
      const { token } = await loadFixture(deployContractsFixture);

      expect(await token.name()).to.be.equal(NAME);
    });

    it('Should deploy with right symbol', async function () {
      const { token } = await loadFixture(deployContractsFixture);

      expect(await token.symbol()).to.be.equal(SYMBOL);
    });

    it('Should deploy with right price', async function () {
      const { token } = await loadFixture(deployContractsFixture);

      expect(await token.price()).to.be.equal(PRICE);
    });

    it('Should deploy with 0 initial total supply', async function () {
      const { token } = await loadFixture(deployContractsFixture);

      expect(await token.totalSupply()).to.be.equal(0);
    });
  });

  describe('Mint', function () {
    it('Should increase balance of caller on given amount', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const mintAmount = AMOUNT;

      await expect(
        token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) }),
      ).to.changeTokenBalance(token, user, mintAmount);
    });

    it('Should increase total supply', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const mintAmount = AMOUNT;
      const currTotalSupply = await token.totalSupply();
      await token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      expect(await token.totalSupply()).to.be.equal(currTotalSupply.add(mintAmount));
    });

    it('Should emit transfer event with right args', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const mintAmount = AMOUNT;
      await expect(token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) }))
        .to.emit(token, 'Transfer')
        .withArgs(ethers.constants.AddressZero, user.address, mintAmount);
    });

    it('Should increase contract Ether balance', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const mintAmount = AMOUNT;
      await expect(
        async () => await token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) }),
      ).to.changeEtherBalance(token.address, PRICE.mul(mintAmount));
    });

    it('Should decrease caller Ether balance', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const mintAmount = AMOUNT;
      await expect(
        async () => await token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) }),
      ).to.changeEtherBalance(user.address, PRICE.mul(mintAmount).mul(-1));
    });

    it('Should revert if message value is less than price * token amount', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const mintAmount = AMOUNT;
      await expect(
        token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount).sub(1) }),
      ).to.be.revertedWith('ERC20: value is less than required');
    });

    it('Should work for several mints for different addresses', async function () {
      const { token } = await loadFixture(deployContractsFixture);
      const [user1, user2, user3] = await ethers.getSigners();

      const mintAmount = AMOUNT;
      const currTotalSupply = await token.totalSupply();
      const currBalance = await ethers.provider.getBalance(token.address);

      await token.connect(user1).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(user2).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(user3).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      expect(await token.balanceOf(user1.address)).to.be.equal(mintAmount);
      expect(await token.balanceOf(user2.address)).to.be.equal(mintAmount);
      expect(await token.balanceOf(user3.address)).to.be.equal(mintAmount);

      expect(await token.totalSupply()).to.be.equal(currTotalSupply.add(mintAmount.mul(3)));
      expect(await ethers.provider.getBalance(token.address)).to.be.equal(
        currBalance.add(PRICE.mul(mintAmount).mul(3)),
      );
    });
  });

  describe('Transfer', function () {
    it('Should increase balance of `to` address', async function () {
      const { token, from, to } = await loadFixture(deployContractsFixture);
      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(token.connect(from).transfer(to.address, transferAmount)).to.changeTokenBalance(
        token,
        to,
        transferAmount,
      );
    });

    it('Should decrease balance of caller', async function () {
      const { token, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(token.connect(from).transfer(to.address, transferAmount)).to.changeTokenBalance(
        token,
        from,
        transferAmount.mul(-1),
      );
    });

    it('Should not change total supply', async function () {
      const { token, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      const currTotalSupply = await token.totalSupply();
      await token.connect(from).transfer(to.address, transferAmount);

      expect(await token.totalSupply()).to.be.equal(currTotalSupply);
    });

    it('Should emit transfer event with right args', async function () {
      const { token, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(token.connect(from).transfer(to.address, transferAmount))
        .to.emit(token, 'Transfer')
        .withArgs(from.address, to.address, transferAmount);
    });

    it('Should revert if `to` is a zero address', async function () {
      const { token, from } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(
        token.connect(from).transfer(ethers.constants.AddressZero, transferAmount),
      ).to.be.revertedWith('ERC20: transfer to the zero address');
    });

    it('Should revert if caller balance is less than amount to transfer', async function () {
      const { token, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT.sub(1);
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(token.connect(from).transfer(to.address, transferAmount)).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance',
      );
    });

    it('Should work for several transfers for different addresses', async function () {
      const { token } = await loadFixture(deployContractsFixture);
      const [user1, user2, user3] = await ethers.getSigners();

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT.mul(3);
      await token.connect(user1).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      const currTotalSupply = await token.totalSupply();

      await expect(
        token.connect(user1).transfer(user2.address, transferAmount),
      ).to.changeTokenBalances(token, [user1, user2], [transferAmount.mul(-1), transferAmount]);
      await expect(
        token.connect(user1).transfer(user3.address, transferAmount),
      ).to.changeTokenBalances(token, [user1, user3], [transferAmount.mul(-1), transferAmount]);

      expect(await token.totalSupply()).to.be.equal(currTotalSupply);
    });
  });

  describe('Burn', function () {
    it('Should decrease balance of caller on given amount', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const burnAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(token.connect(user).burn(burnAmount)).to.changeTokenBalance(
        token,
        user,
        burnAmount.mul(-1),
      );
    });

    it('Should decrease total supply', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const burnAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      const currTotalSupply = await token.totalSupply();
      await token.connect(user).burn(burnAmount);

      expect(await token.totalSupply()).to.be.equal(currTotalSupply.sub(burnAmount));
    });

    it('Should emit transfer event with right args', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const burnAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(token.connect(user).burn(burnAmount))
        .to.emit(token, 'Transfer')
        .withArgs(user.address, ethers.constants.AddressZero, burnAmount);
    });

    it('Should revert if caller balance is less that amount to burn', async function () {
      const { token, user } = await loadFixture(deployContractsFixture);

      const burnAmount = AMOUNT;
      const mintAmount = AMOUNT.sub(1);
      await token.connect(user).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(token.connect(user).burn(burnAmount)).to.be.revertedWith(
        'ERC20: burn amount exceeds balance',
      );
    });

    it('Should work for several burns for different addresses', async function () {
      const { token } = await loadFixture(deployContractsFixture);
      const [user1, user2, user3] = await ethers.getSigners();

      const burnAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(user1).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(user2).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(user3).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      const currTotalSupply = await token.totalSupply();

      await expect(token.connect(user1).burn(burnAmount)).to.changeTokenBalance(
        token,
        user1,
        burnAmount.mul(-1),
      );
      await expect(token.connect(user2).burn(burnAmount)).to.changeTokenBalance(
        token,
        user2,
        burnAmount.mul(-1),
      );
      await expect(token.connect(user3).burn(burnAmount)).to.changeTokenBalance(
        token,
        user3,
        burnAmount.mul(-1),
      );

      expect(await token.totalSupply()).to.be.equal(currTotalSupply.sub(burnAmount.mul(3)));
    });
  });

  describe('Approve', function () {
    it('Should update `_allowances` mapping by setting on `amount`', async function () {
      const { token, owner, spender } = await loadFixture(deployContractsFixture);

      const approveAmount = AMOUNT;
      await token.connect(owner).approve(spender.address, approveAmount);

      expect(await token.allowance(owner.address, spender.address)).to.be.equal(approveAmount);
    });

    it('Should emit approval event with right args', async function () {
      const { token, owner, spender } = await loadFixture(deployContractsFixture);

      const approveAmount = AMOUNT;

      await expect(token.connect(owner).approve(spender.address, approveAmount))
        .to.emit(token, 'Approval')
        .withArgs(owner.address, spender.address, approveAmount);
    });

    it('Should revert if approval given for zero address', async function () {
      const { token, owner } = await loadFixture(deployContractsFixture);

      const approveAmount = AMOUNT;

      await expect(
        token.connect(owner).approve(ethers.constants.AddressZero, approveAmount),
      ).to.be.revertedWith('ERC20: approve to the zero address');
    });
    // it('Should revert if approval given from zero address', async function () {
    //   const { token, spender } = await loadFixture(deployContractsFixture)

    //   const approveAmount = AMOUNT

    //   await expect(token.connect(ethers.constants.AddressZero).approve(spender.address, approveAmount))
    //     .to.be.revertedWith('ERC20: approve from the zero address')
    // })

    it('Should work for several approvals for different addresses', async function () {
      const { token } = await loadFixture(deployContractsFixture);
      const [user1, user2, user3] = await ethers.getSigners();

      const approveAmount = AMOUNT;
      await token.connect(user1).approve(user2.address, approveAmount);
      await token.connect(user1).approve(user3.address, approveAmount);
      await token.connect(user2).approve(user3.address, approveAmount);

      expect(await token.allowance(user1.address, user2.address)).to.be.equal(approveAmount);
      expect(await token.allowance(user1.address, user3.address)).to.be.equal(approveAmount);
      expect(await token.allowance(user2.address, user3.address)).to.be.equal(approveAmount);
    });
  });

  describe('Increase allowance', function () {
    it('Should update `_allowances` mapping by increasing on `amount`', async function () {
      const { token, owner, spender } = await loadFixture(deployContractsFixture);

      const increaseAmount = AMOUNT;
      const currAllowance = await token.allowance(owner.address, spender.address);
      await token.connect(owner).increaseAllowance(spender.address, increaseAmount);

      expect(await token.allowance(owner.address, spender.address)).to.be.equal(
        currAllowance.add(increaseAmount),
      );
    });

    it('Should emit approval event with right args', async function () {
      const { token, owner, spender } = await loadFixture(deployContractsFixture);

      const increaseAmount = AMOUNT;
      const currAllowance = await token.allowance(owner.address, spender.address);

      await expect(token.connect(owner).increaseAllowance(spender.address, increaseAmount))
        .to.emit(token, 'Approval')
        .withArgs(owner.address, spender.address, currAllowance.add(increaseAmount));
    });

    it('Should revert if approval given for zero address', async function () {
      const { token, owner } = await loadFixture(deployContractsFixture);

      const increaseAmount = AMOUNT;

      await expect(
        token.connect(owner).increaseAllowance(ethers.constants.AddressZero, increaseAmount),
      ).to.be.revertedWith('ERC20: approve to the zero address');
    });

    it('Should work for several increasings for different addresses', async function () {
      const { token } = await loadFixture(deployContractsFixture);
      const [user1, user2, user3] = await ethers.getSigners();

      const approveAmount = AMOUNT;
      const currAllowanceUser1User2 = await token.allowance(user1.address, user2.address);
      const currAllowanceUser1User3 = await token.allowance(user1.address, user3.address);
      await token.connect(user1).approve(user2.address, approveAmount);
      await token.connect(user1).approve(user3.address, approveAmount);

      expect(await token.allowance(user1.address, user2.address)).to.be.equal(
        currAllowanceUser1User2.add(approveAmount),
      );
      expect(await token.allowance(user1.address, user3.address)).to.be.equal(
        currAllowanceUser1User3.add(approveAmount),
      );
    });
  });
  // Decrease allowance
  describe('Decrease allowance', function () {
    it('Should update `_allowances` mapping by decreasing on `amount`', async function () {
      const { token, owner, spender } = await loadFixture(deployContractsFixture);

      const approveAmount = AMOUNT;
      await token.connect(owner).approve(spender.address, approveAmount);
      const decreaseAmount = AMOUNT;
      const currAllowance = await token.allowance(owner.address, spender.address);
      await token.connect(owner).decreaseAllowance(spender.address, decreaseAmount);

      expect(await token.allowance(owner.address, spender.address)).to.be.equal(
        currAllowance.sub(decreaseAmount),
      );
    });

    it('Should emit approval event with right args', async function () {
      const { token, owner, spender } = await loadFixture(deployContractsFixture);

      const approveAmount = AMOUNT;
      await token.connect(owner).approve(spender.address, approveAmount);
      const decreaseAmount = AMOUNT;
      const currAllowance = await token.allowance(owner.address, spender.address);

      await expect(token.connect(owner).decreaseAllowance(spender.address, decreaseAmount))
        .to.emit(token, 'Approval')
        .withArgs(owner.address, spender.address, currAllowance.sub(decreaseAmount));
    });

    it('Should revert if approval given for zero address', async function () {
      const { token, owner } = await loadFixture(deployContractsFixture);

      const decreaseAmount = AMOUNT;

      await expect(
        token.connect(owner).decreaseAllowance(ethers.constants.AddressZero, decreaseAmount),
      ).to.be.reverted;
    });

    it('Should revert if decreased allowance is below zero', async function () {
      const { token, owner, spender } = await loadFixture(deployContractsFixture);

      const approveAmount = AMOUNT;
      const decreaseAmount = approveAmount.add(1);
      await token.connect(owner).approve(spender.address, approveAmount);

      await expect(
        token.connect(owner).decreaseAllowance(spender.address, decreaseAmount),
      ).to.be.revertedWith('ERC20: decreased allowance below zero');
    });

    it('Should work for several decreasings for different addresses', async function () {
      const { token } = await loadFixture(deployContractsFixture);
      const [user1, user2, user3] = await ethers.getSigners();

      const approveAmount = AMOUNT;
      const decreaseAmount = approveAmount.sub(100);
      await token.connect(user1).approve(user2.address, approveAmount);
      await token.connect(user1).approve(user3.address, approveAmount);
      const currAllowanceUser1User2 = await token.allowance(user1.address, user2.address);
      const currAllowanceUser1User3 = await token.allowance(user1.address, user3.address);
      await token.connect(user1).decreaseAllowance(user2.address, decreaseAmount);
      await token.connect(user1).decreaseAllowance(user3.address, decreaseAmount);

      expect(await token.allowance(user1.address, user2.address)).to.be.equal(
        currAllowanceUser1User2.sub(decreaseAmount),
      );
      expect(await token.allowance(user1.address, user3.address)).to.be.equal(
        currAllowanceUser1User3.sub(decreaseAmount),
      );
    });
  });

  describe('Transfer from', function () {
    it('Should update `_allowances` mapping by decreasing on `amount`', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT.sub(500);
      const mintAmount = AMOUNT;
      const approveAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(from).approve(owner.address, approveAmount);
      const currAllowance = await token.allowance(from.address, owner.address);
      await token.connect(owner).transferFrom(from.address, to.address, transferAmount);

      expect(await token.allowance(from.address, owner.address)).to.be.equal(
        currAllowance.sub(transferAmount),
      );
    });

    it('Should increase balance of `to` address', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT.sub(500);
      const mintAmount = AMOUNT;
      const approveAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(from).approve(owner.address, approveAmount);

      await expect(
        token.connect(owner).transferFrom(from.address, to.address, transferAmount),
      ).to.changeTokenBalance(token, to, transferAmount);
    });

    it('Should decrease balance of `from` address', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT.sub(500);
      const mintAmount = AMOUNT;
      const approveAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(from).approve(owner.address, approveAmount);

      await expect(
        token.connect(owner).transferFrom(from.address, to.address, transferAmount),
      ).to.changeTokenBalance(token, from, transferAmount.mul(-1));
    });

    it('Should not change total supply', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT.sub(500);
      const mintAmount = AMOUNT;
      const approveAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(from).approve(owner.address, approveAmount);
      const currTotalSupply = await token.totalSupply();

      await token.connect(owner).transferFrom(from.address, to.address, transferAmount);

      expect(await token.totalSupply()).to.be.equal(currTotalSupply);
    });

    it('Should emit transfer event with right args', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      const approveAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(from).approve(owner.address, approveAmount);

      await expect(token.connect(owner).transferFrom(from.address, to.address, transferAmount))
        .to.emit(token, 'Transfer')
        .withArgs(from.address, to.address, transferAmount);
    });

    it('Should revert if `to` is a zero address', async function () {
      const { token, owner, from } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      const approveAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(from).approve(owner.address, approveAmount);

      await expect(
        token
          .connect(owner)
          .transferFrom(from.address, ethers.constants.AddressZero, transferAmount),
      ).to.be.revertedWith('ERC20: transfer to the zero address');
    });

    it('Should revert if `from` is a zero address', async function () {
      const { token, owner, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;

      await expect(
        token
          .connect(owner)
          .transferFrom(ethers.constants.AddressZero, to.address, transferAmount),
      ).to.be.reverted;
      // Test will fail with error from _spendAllowance function
    });

    it('Should revert if allowance is not enough', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      const approveAmount = AMOUNT.sub(200);
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(from).approve(owner.address, approveAmount);

      await expect(
        token.connect(owner).transferFrom(from.address, to.address, transferAmount),
      ).to.be.revertedWith('ERC20: insufficient allowance');
    });

    it('Should revert if allowance is 0 and transfer amount is non-zero', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await expect(
        token.connect(owner).transferFrom(from.address, to.address, transferAmount),
      ).to.be.revertedWith('ERC20: insufficient allowance');
    });

    it('Should not revert if allowance is 0 and transfer amount is zero', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = ethers.BigNumber.from(0);
      const mintAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });

      await token.connect(owner).transferFrom(from.address, to.address, transferAmount);
    });

    it('Should revert if not enough balance on `from` address', async function () {
      const { token, owner, from, to } = await loadFixture(deployContractsFixture);

      const transferAmount = AMOUNT;
      const mintAmount = AMOUNT.sub(200);
      const approveAmount = AMOUNT;
      await token.connect(from).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(from).approve(owner.address, approveAmount);

      await expect(
        token.connect(owner).transferFrom(from.address, to.address, transferAmount),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Should work for several transfers for different addresses', async function () {
      const { token } = await loadFixture(deployContractsFixture);
      const [owner, user1, user2, user3, user4] = await ethers.getSigners();

      const transferAmount = AMOUNT.sub(500);
      const mintAmount = AMOUNT;
      const approveAmount = AMOUNT;
      await token.connect(user1).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(user3).mint(mintAmount, { value: PRICE.mul(mintAmount) });
      await token.connect(user1).approve(owner.address, approveAmount);
      await token.connect(user3).approve(owner.address, approveAmount);
      const currAllowanceUser1Owner = await token.allowance(user1.address, owner.address);
      const currAllowanceUser3Owner = await token.allowance(user1.address, owner.address);
      const currTotalSupply = await token.totalSupply();

      await expect(
        token.connect(owner).transferFrom(user1.address, user2.address, transferAmount),
      ).to.changeTokenBalances(token, [user1, user2], [transferAmount.mul(-1), transferAmount]);
      await expect(
        token.connect(owner).transferFrom(user3.address, user4.address, transferAmount),
      ).to.changeTokenBalances(token, [user3, user4], [transferAmount.mul(-1), transferAmount]);
      expect(await token.allowance(user1.address, owner.address)).to.be.equal(
        currAllowanceUser1Owner.sub(transferAmount),
      );
      expect(await token.allowance(user3.address, owner.address)).to.be.equal(
        currAllowanceUser3Owner.sub(transferAmount),
      );
      expect(await token.totalSupply()).to.be.equal(currTotalSupply);
    });
  });
});
