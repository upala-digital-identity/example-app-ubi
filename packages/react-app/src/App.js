import React, { useCallback, useEffect, useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";

import { Web3Provider, getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link } from "./components";
import { web3Modal, logoutOfWeb3Modal } from './utils/web3Modal'
import logo from "./ethereumLogo.png";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";


async function balance(ubiApp) {
  // console.log("ubiApp.myUBIBalance() ", await ubiApp.myUBIBalance());
  const balance = ethers.utils.formatEther(await ubiApp.myUBIBalance());
  console.log("Ubi balance: ", balance);
}

async function claim(ubiApp, upala) {
  const upalaUserId = (await upala.myId()).toNumber();
  console.log("upalaUserId", upalaUserId);

  // TODO WARNING!!! Hardcoded path - [user, metacartel, bladerunner]
  // Only one path possible 
  const claimUBI = await ubiApp.claimUBI([upalaUserId, 1, 4]);
  console.log("claimUBI: ", claimUBI);
}

function WalletButton({ provider, loadWeb3Modal }) {
  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {!provider ? "Connect Wallet" : "Disconnect Wallet"}
    </Button>
  );
}

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, setProvider] = useState();
  const [ubiApp, setUbiApp] = useState();
  const [upala, setUpala] = useState();

  /* Open wallet selection modal. */
  const loadWeb3Modal = useCallback(async () => {
    const newProvider = await web3Modal.connect();
    const userAddress = newProvider.selectedAddress;
    const newWeb3Provider = new Web3Provider(newProvider)
    setProvider(newWeb3Provider);
    const userSigner = newWeb3Provider.getSigner();
    let chain_id = (await newWeb3Provider.getNetwork()).chainId;
    
    if (addresses[chain_id] == undefined) {
      console.log("Unable to find addresses for the provided chain id. Switching to localhost");
      chain_id = 0;
    }
    
    console.log("chain_id", chain_id);
    console.log("addresses[chain_id].UBIExampleDApp, ", addresses[chain_id].UBIExampleDApp);
    setUbiApp(new Contract(
      addresses[chain_id].UBIExampleDApp, 
      abis.UBIExampleDApp, 
      userSigner
    ))
    setUpala(new Contract(
      addresses[chain_id].Upala, 
      abis.Upala,
      userSigner
    ))
  }, []);

  /* If user has loaded a wallet before, load it automatically. */
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} />
      </Header>
      <Body>
        <Image src={logo} alt="react-logo" />
        <p>
          This DApp is using Upala human uniqueness score. <br />
        </p>
        
        <Button onClick={() => claim(ubiApp, upala)}>
          Claim
        </Button>

        <Button onClick={() => balance(ubiApp)}>
          Balance
        </Button>

        <Link
          href="https://upala-docs.readthedocs.io/en/latest/"
          style={{ marginTop: "8px" }}
        >
          Upala docs
        </Link>
        <Link href="https://t.me/cherish_the_difference_Upala">Join us on Telegram</Link>
        <Link href="https://discord.gg/fa3q8rq" >Join us on Discord</Link>
      </Body>
    </div>
  );
}

export default App;
