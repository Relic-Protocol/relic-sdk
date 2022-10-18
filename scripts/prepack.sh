#!/usr/bin/env bash

npx hardhat compile
mkdir -p packages/contracts/abi
cp artifacts/packages/contracts/{lib/,interfaces/,}*/*.json packages/contracts/abi
