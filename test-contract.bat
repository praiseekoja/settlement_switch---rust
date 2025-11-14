@echo off
echo Checking contract status...
echo.
"C:\Program Files\nodejs\node.exe" -e "const {createPublicClient,http}=require('viem');const {arbitrumSepolia}=require('viem/chains');const c=createPublicClient({chain:arbitrumSepolia,transport:http('https://sepolia-rollup.arbitrum.io/rpc')});c.getBytecode({address:'0x443ec868aafd6eba80d124a8cb4345cc827e7ee1'}).then(code=>console.log(code?'Contract exists!':'No contract found')).catch(e=>console.log('Error:',e.message));"
echo.
pause


