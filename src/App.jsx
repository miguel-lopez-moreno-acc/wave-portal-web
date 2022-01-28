import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { alpha, styled } from '@mui/material/styles';
import "./App.css";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import abi from "./utils/WavePortal.json";

const CustomTextField = styled(TextField)({
  color: "white",
  width: 350,
  '& .MuiOutlinedInput-input': {
    color: 'white'
  },
  '& label': {
    color: 'white'
  },
  '& MuiInputLabel-root': {
    color: 'white',
  },
  '& .MuiFormLabel-root-MuiInputLabel-root': {
    color: 'white'
  },
  '& label.Mui-focused': {
    color: 'white',
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: 'white',
    color: 'white'
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'white',
      color: 'white'
    },
    '&:hover fieldset': {
      borderColor: 'white',
      color: 'white'
    },
    '&.Mui-focused fieldset': {
      borderColor: 'white',
      color: 'white'
    },
  }
});

const CustomButton = styled(Button)(({ theme }) => ({
  color: '#FFF',
  width: 350,
  backgroundColor: '#365780',
  '&:hover': {
    backgroundColor: '#3d1e3d',
  },
}));

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveText, setWaveText] = useState("");
  const contractAddress = "0x3a038C3142Ae572273dfC245DAb0E1881D4D3d08";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const formatDate = (timestamp) => {
    let date = new Date(timestamp * 1000);
    const day = ((date.getDate()).toString().length > 1) ? date.getDate() : '0' + date.getDate();
    let month = date.getMonth() + 1;
    month = ((month).toString().length > 1) ? month : '0' + month;
    const year = date.getFullYear();
    date = month + '/' + day + '/' + year;
    return date;
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(async (wave) => {
          const date = formatDate(wave.timestamp);

          wavesCleaned.push({
            address: wave.waver,
            timestamp: date,
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        if(waveText.length > 0) {
          const waveTxn = await wavePortalContract.wave(waveText, { gasLimit: 300000 });
          console.log("Mining...", waveTxn.hash);
  
          await waveTxn.wait();
          console.log("Mined -- ", waveTxn.hash);
  
          count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());
  
          setWaveText("");
          /* getAllWaves(); */
        } else {
          console.log("WaveText is Empty");
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();

    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      const date = formatDate(timestamp);
      setAllWaves( prevState => [
        ...prevState,
        {
          address: from,
          timestamp: date,
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <Stack display="flex" justifyContent="center" alignItems="center" spacing={0} direction="row">
            <img src="/logo.png" width={40} height={40} alt="logo" style={{ marginTop: 5 }} />
            <div>ave Portal</div>
          </Stack>
        </div>

        <div className="bio">
          Connect your Ethereum wallet and wave at me!
        </div>

        <Box
          component="form"
          noValidate
          display="flex"
          justifyContent="center"
          alignItems="center"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 30 }}
          sx={{
            display: 'grid',
            gridTemplateColumns: { sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <Stack display="flex" justifyContent="center" alignItems="center" spacing={2} direction="column">
            <CustomTextField label="Place your text here" id="custom-css-outlined-input" style={{ color: 'white' }} />
            <CustomButton variant="contained" onClick={wave}>
              Wave at Me
            </CustomButton>
            
            {!currentAccount && (
              <CustomButton variant="contained" onClick={connectWallet}>
                Connect Wallet
              </CustomButton>
            )}
          </Stack>
        </Box>

        <Box
          style={{marginTop: 30}}
        >
          {allWaves.map((wave, index) => {
            return (
              <Card sx={{minWidth: 80, width: 350}} key={index}>
                <CardContent>
                  <Stack spacing={1} direction="row">
                    <Typography sx={{fontSize: 14, color: '#111e36'}} style={{color: '#111e36'}} component="div">
                      Address:
                    </Typography>
                    <Typography sx={{fontSize: 14, color: '#111e36'}} style={{color: '#111e36'}} component="div">
                      {wave.address}
                    </Typography>
                  </Stack>
                  <Stack spacing={1} direction="row">
                    <Typography sx={{fontSize: 14, color: '#111e36'}} style={{color: '#111e36'}} component="div">
                      Time:
                    </Typography>
                    <Typography sx={{fontSize: 14, color: '#111e36'}} style={{color: '#111e36'}} component="div">
                      {wave.timestamp}
                    </Typography>
                  </Stack>
                  <Stack spacing={1} direction="row">
                    <Typography sx={{fontSize: 14, color: '#111e36'}} style={{color: '#111e36'}} component="div">
                      Message:
                    </Typography>
                    <Typography sx={{fontSize: 14, color: '#111e36'}} style={{color: '#111e36'}} component="div">
                      {wave.message}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </div>
    </div>
  );
}

export default App
