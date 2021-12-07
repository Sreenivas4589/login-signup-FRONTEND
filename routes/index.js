const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

//for ethereu wallet
const Web3 = require("web3");
//infura link , logged in using gmail main acc
const web3 = new Web3(
  "https://rinkeby.infura.io/v3/0480f6f61a2c48d18ca1365c7de71013"
);

const { EthHdWallet } = require("eth-hd-wallet");
var hdkey = require("ethereumjs-wallet/hdkey");
var bip39 = require("bip39");

const ETx = require("ethereumjs-tx");
const Transaction = require("ethereumjs-tx");

dotenv.config();
sgMail.setApiKey(`SG.${process.env.APIKEY}`);

const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Bought",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Sold",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TransferReceived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "destAddr",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "TransferSent",
    type: "event",
  },
  {
    inputs: [],
    name: "balance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "test",
        type: "address",
      },
    ],
    name: "buy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "test",
        type: "address",
      },
    ],
    name: "getBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const contractAddress = "0x9e18a2fBdc201CC3D2d8c619F27762833B426A69";

const addressOfTokenToSeeInMetaMask =
  "0xB87a21E6EE7C4F817d05FE74434bbda07575a7F6";





router.post("/register", async (req, res) => {
  console.log("register called", req.body);

  //checking if user already exists or not
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("Email Already Exists");

  //hashing the password
  //10 is the complixity of the generated string
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);


  //creating new ethereum acc for the signedup user
  const mnemonic = bip39.generateMnemonic(); //generates string
  // console.log(`mnemonic: ${mnemonic}`);

  const wallet = EthHdWallet.fromMnemonic(mnemonic);
  let address = wallet.generateAddresses(1);
  // console.log(`EthHdWallet Address: ${address}`);

  bip39.mnemonicToSeed(mnemonic).then((seed) => {
    // console.log(seed);
    var path = `m/44'/60'/0'/0/0`;
    var hdwallet = hdkey.fromMasterSeed(seed);
    var wallet = hdwallet.derivePath(path).getWallet();
    var address2 = "0x" + wallet.getAddress().toString("hex");
    var privateKey = wallet.getPrivateKey().toString("hex");
   

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashPassword,
      privateKey: privateKey,
      Address: address2,
      Mnemonic: mnemonic,
    });

    user.save();

    //sending email
    const msg = {
      to: `${req.body.email}`,
      from: "tiwariabhishek7275@gmail.com",
      subject: "Welcome to our platform",
      html: ` <h1>Thank you for signing up to our platform , here are your wallet details </h1>
      <span> 
       <b> Private Key :</b>  <p>${privateKey} </p> <br>
       <b> Address : </b> <p> ${address2} </p> <br>
       <b> Mnemonic: </b> <p> ${mnemonic} </p> <br>
      </span>  
      `,
    };

    sgMail.send(msg, function (err, info) {
      if (err) {
        console.log("Errorin sending Mail", err);
        res.status(400).send(err);
      } else {
        console.log("Mail sent");
        res
          .status(200)
          .send(
            "SignUp Successful , Please check your email for wallet details"
          );
      }
    });
  });
});






router.post("/login", async (req, res) => {
  //checking if user already exists or not
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Email Doesn't Exists");

  //if password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send("Invalid Password");

  //res.send("Logged in Successfully");
  // console.log("User logged in backend", user);
  //Create and assign a token , we can add any details inside the token eg name
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);

  //getting the balance
  // const balance = web3.utils.fromWei(
  //   await web3.eth.getBalance(user.Address),
  //   "ether"
  // );

  // console.log("User Balance", balance);

  let responseObject = {
    token: token,
    userDetails: user,
    // walletBalance: balance,
  };

  //adding token to the header

  // res.cookie("auth-token-poc", token);
  res.header("auth-token", token).send(responseObject);
});

module.exports = router;
