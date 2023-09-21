// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC20 is ERC20, Ownable {
    // Token price
    uint256 private _price;

    /**
     * @dev Sets the values for {name} {symbol} and {price}.
     *
     * All of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_, uint256 price_) ERC20(name_, symbol_) {
        _price = price_;
    }

    /**
     * @dev Returns the price of the token
     */
    function price() public view returns (uint256) {
        return _price;
    }

    /**
     * Mints `amount` of tokens to the caller
     *
     * Requirements:
     *
     * - the caller must have a balance of at least `amount`.
     */
    function mint(uint256 amount) external payable {
        require(msg.value >= amount * _price, "ERC20: value is less than required");
        _mint(msg.sender, amount);
    }

    /**
     * @dev Destroys `amount` tokens from caller, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - message sender must have at least `amount` tokens.
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Transfers all Ether from contract to owner.
     *
     * Requirements:
     * - message sender must be owner.
     */
    function withdrawEther() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
