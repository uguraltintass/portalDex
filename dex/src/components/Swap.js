import React, {useState, useEffect} from 'react'
import { Input, Popover, Radio, Modal, message} from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";
import { useAsyncError } from 'react-router-dom';
import axios from "axios";
import { useSendTransaction, useWaitForTransaction } from 'wagmi';

function Swap(props) {

  const {address, isConnected} = props;
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to:null,
    data:null,
    value:null,
  });

  const {data, sendTransaction} = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    }
  })

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e){
    setTokenOneAmount(e.target.value);
    if(e.target.value && prices){
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2))
    } else {
      setTokenTwoAmount(null);
    }
  }

  function switchTokens(){
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i) {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    if (changeToken===1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address)
    } else{
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address)
    }
    setIsOpen(false);
  }

  async function fetchPrices(one, two) {

    const res = await axios.get('http://localhost:3001/tokenPrice', {
      params: {addressOne: one, addressTwo: two}
    })

    setPrices(res.data)

  }

  async function fetchDexSwap(){

    const url="https://api.1inch.dev/v6.0/1/approve/allowance";

    const config={
      headers:{
        "Authorization":"Bearer pDZdUv4RjMQ5pOx8U9BHH8P5AgEoQ8nv"
      },
      params: {
        "tokenAddress": tokenOne.address,
        "walletAddress": address
      }
    };

    const allowance = await axios.get(url, config);

    if(allowance.data.allowance === "0") {

      const url = "https://api.1inch.dev/swap/v6.0/1/approve/transaction";

      const config = {
          headers: {
          "Authorization": "Bearer pDZdUv4RjMQ5pOx8U9BHH8P5AgEoQ8nv"
        },
              params: {
          "tokenAddress": tokenOne.address
        }
      };

      const approve = await axios.get(url, config);

      setTxDetails(approve.data);
      console.log("not approved")
      return

    }

    console.log("make swap")

  }

  useEffect(() =>{
    fetchPrices(tokenList[0].address, tokenList[1].address)
  }, [])

  useEffect(()=>{

      if(txDetails.to && isConnected){
        sendTransaction();
      }
  }, [txDetails])

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  )

  return (
    <>
    <Modal
      open={isOpen}
      footer={null}
      onCancel={() => setIsOpen(false)}
      title="Select a token"
    >
      <div className="modalContent">
        {tokenList?.map((e,i)=>{
          return (
            <div
              className="tokenChoice"
              key={i}
              onClick={() => modifyToken(i)}
            >
              <img src={e.img} alt={e.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{e.name}</div>
                <div className="tokenTicker">{e.ticker}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
    <div className="tradeBox">
      <div className="tradeBoxHeader">
        <h4>Swap</h4>
        <Popover 
          content={settings}
          title="Settings" 
          trigger="click" 
          placement="bottomRight"
        >
          <SettingOutlined className="cog" />
        </Popover>
      </div>
      <div className="inputs">
        <Input placeholder="0" value={tokenOneAmount} onChange={changeAmount} disabled={!prices} />
        <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
        <div className="switchButton" onClick={switchTokens}>
          <ArrowDownOutlined className="switchArrow" />
        </div>
        <div className="assetOne" onClick={() => openModal(1)}>
          <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
          {tokenOne.ticker}
          <DownOutlined/>
        </div>
        <div className="assetTwo" onClick={() => openModal(2)}>
        <img src={tokenTwo.img} alt="assetTwoLogo" className="assetLogo" />
          {tokenTwo.ticker}
          <DownOutlined/>
        </div>
      </div>
      <div className="swapButton" disabled={!tokenOneAmount || !isConnected} onClick={fetchDexSwap}>Swap</div>
    </div>
    </>
  )
}

export default Swap