# Test task for Solidity QA trainee / junior position

## Introduction

This repository contains broken ERC-20 contract, based on Open Zeppelin implementation. It does not work well and your
task is to write unit test, find all mistakes and correct the contract, so it will work as expected. Enjoy!

## Getting started

- Clone this repository locally
- Install all dependencies using yarn
- Run `npx hardat test` to insure, that contract is compiling
- Create `test` directory and `erc20.ts` test file

## Tasks

- Use `loadFixture` from `hardhat-network-helpers` for all tests

### Deployment

- Should deploy with proper address
- Should deploy with right name
- Should deploy with right symbol
- Should deploy with right price
- Should be 0 total supply after deploy

### Mint

- Should increase balance of caller on given amount
- Should increase total supply
- Should emit transfer event with right args
- Should increase contract ethers balance
- Should decrease caller ethers balance
- Should revert if message value is less than price \* token amount
- Make tests for several mints for different addresses in one unit test

### Transfer

- Should increase balance of `to` address
- Should decrease balance of caller
- Should not change total supply
- Should emit transfer event with right args
- Should revert if `to` is a zero address
- Should revert if caller balance is less than amount to transfer
- Make tests for several transfers for different addresses in one unit test

### Burn

- Should decrease balance of caller on given amount
- Should decrease total supply
- Should emit transfer event with right args
- Should revert if caller balance is less that amount to burn
- Make tests for several burns for different addresses in one unit test

### Approve

- Should update `_allowances` mapping by setting `amount`
- Should emit approval event with right args
- Should revert if approval given for zero address
- Make tests for several approvals for different addresses in one unit test

### Increase allowance

- Should update `_allowances` mapping by increasing on `amount`
- Should emit approval event with right args
- Should revert if approval given for zero address
- Make tests for several increasings for different addresses in one unit test

### Decrease allowance

- Should update `_allowances` mapping by decreasing on `amount`
- Should emit approval event with right args
- Should revert if approval given for zero address --
- Should revert if decreased allowance is below zero
- Make tests for several decreasings for different addresses in one unit test

### Transfer from

- Should update `_allowances` mapping by decreasing on `amount`
- Should increase balance of `to` address
- Should decrease balance of `from` address
- Should not change total supply
- Should emit transfer event
- Should revert if `to` is a zero address
- Should revert if `from` is a zero address --
- Should revert if allowance is not enough
- Should revert if allowance is 0 --
- Should revert if not enough balance on `from` address
- Make tests for several transfers for different addresses in one unit test

## Optional task

Please write your opinion in smart-contract business logic. Are there any functions that you would add?
What are they? Write short description.

## When you are ready

- Check that all tasks are completed
- Create NEW repository on GitHub
- Make it public or private with access granted to reviewers
- Push unit-tests and fixed contract to your repository
- Write to your reviewers and wait for feedback
