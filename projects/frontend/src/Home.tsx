// src/components/Home.tsx

import * as algokit from "@algorandfoundation/algokit-utils";
import { useWallet } from '@txnlab/use-wallet'
import React, { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import { DigitalMarketplaceClient } from './contracts/DigitalMarketplace'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import MethodCall from "./components/MethodCall";
import { buy, create, deleteApp } from "./methods";
import algosdk from "algosdk";


interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  algokit.Config.configure({ populateAppCallResources: true})


  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)

  const [appId, setAppId] = useState<number>(0)
  // assetId, unitaryPrice, quantity
  const [assetId, setAssetId] = useState<bigint>(0n)
  const [unitaryPrice, setUnitaryPrice] = useState<bigint>(0n)
  const [quantity, setQuantity] = useState<bigint>(0n)
  const [unitLeft, setUnitsLeft] = useState<bigint>(0n)
  const [seller, setSeller] = useState<string | undefined>(undefined)

  const { activeAddress, signer } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = algokit.AlgorandClient.fromConfig({algodConfig});
  algorand.setDefaultSigner(signer!);

  useEffect(() => {
        
        dmClient.getGlobalState()
        .then((globalState) => {
          setUnitaryPrice(globalState.unitaryPrice?.asBigInt() ?? 0n);
          const id = globalState.assetId?.asBigInt() ?? 0n;
          setAssetId(id);
          algorand.account.getAssetInformation(algosdk.getApplicationAddress(appId), id).then((assetInfo) => {
            setUnitsLeft(assetInfo.balance)
          })
        }).catch( () => {
          setUnitaryPrice(0n);
          setAssetId(0n);
        }
    )

    algorand.client.algod.getApplicationByID(appId).do().then((response) => {
      setSeller(response.params.creator);
    })
  }, [appId])

  //funtion to handle change in appId, search for the app in the blockchain and update the state of appId, assetId and unitaryPrice
  const handleChangeAppId = async (appId: number) => {
    setAppId(appId);
    try {
      const globalState = await dmClient.getGlobalState();
      setUnitaryPrice(globalState.unitaryPrice?.asBigInt() ?? 0n);
      const id = globalState.assetId?.asBigInt() ?? 0n;
      setAssetId(id);
      const assetInfo = await algorand.account.getAssetInformation(algosdk.getApplicationAddress(appId), id);
      setUnitsLeft(assetInfo.balance)
    } catch (e) {
      console.log(e);
      setUnitaryPrice(0n);
      setAssetId(0n);
    }
  }


  const dmClient = new DigitalMarketplaceClient({
      resolveBy: 'id',
      id: appId,
      sender: {addr: activeAddress!, signer}
    }, algorand.client.algod,
  )

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">AlgoKit 🙂</div>
          </h1>
          <p className="py-6">
            This starter has been generated using official AlgoKit React template. Refer to the resource below for next steps.
          </p>

          <div className="grid">

            
            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>

            <div className="divider" />

            <label className="label"> App ID </label>
            <input type="number" className="input input-bordered"  value={appId} onChange={(e) => handleChangeAppId(e.currentTarget.valueAsNumber || 0)}/>
            
            { activeAddress && appId ===0 && (
              <div>
                <label className="label"> Unitary Price </label>
                <input type="number" className="input input-bordered" 
                value={(unitaryPrice/BigInt(10e6)).toString()}
                onChange={(e)=>{setUnitaryPrice(BigInt(e.currentTarget.value || 0) * BigInt(10e6) )} } />

              </div>
              )}
            <div className="divider" />

            { activeAddress && appId ===0 && (
              <div>
                <MethodCall 
                  methodFunction = {create(algorand, dmClient, assetId, unitaryPrice, 10n, activeAddress, setAppId)} 
                  text="create App"
                  />
              </div>
            )}

            {appId && (
              <div>
                <label className="label"> Asset ID</label>
                <input type="text" className="input input-bordered"  value={assetId.toString()} readOnly />
                <label className="label"> Units Lefts</label>
                <input type="text" className="input input-bordered"  value={unitLeft.toString()} readOnly />
              </div>
            ) }

            <div className="divider" />

            { activeAddress && appId !==0 && unitLeft > 0 && (
              <div>
                <label className="label"> Price Per Unit </label>
                <input type="number" className="input input-bordered"  value={(unitaryPrice/BigInt(10e6)).toString()} readOnly />
                <label className="label"> Desired Quantity </label>
                <input type="number" className="input input-bordered" 
                value={quantity.toString()}
                onChange={(e)=>{
                    setQuantity(BigInt(e.currentTarget.value))
                  } 
                } 
                />
                <MethodCall 
                  methodFunction = {buy(algorand, dmClient, activeAddress, algosdk.getApplicationAddress(appId), quantity, unitaryPrice, setUnitsLeft)} 
                  text={`Buy ${quantity} for ${(unitaryPrice * BigInt(quantity)/BigInt(10e6)).toString()} ALGO`}
                  />
              </div>
            )}

             {appId !==0 && unitLeft <= 0n && activeAddress !== seller && (
              <div>
                <button className="btn btn-disabled m-2" disabled> Sold Out!</button>
              </div>
             )} 

            {appId !==0 && unitLeft <= 0n && activeAddress === seller && (
              <MethodCall 
              methodFunction={deleteApp(algorand, dmClient, setAppId)} 
              text="Delete App" 
              />
            )} 

          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
