import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { verifyProof } from "../contract";
import Loading from "./components/Loading";
import { Typography } from "@mui/material";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


function createData(
  id: number,
  choice: number,
  bet: number,

) {
  return [id, choice, bet];
}

export default function Upload() {
    const [betsChoices, setBetsChoices] =  useState<bigint[][]>([]);
    const [bet, setBet] = useState('5');
    const [choice, setChoice] = useState('0');
    const [betsCount, setBetsCount] = useState(0);

    const [c, setC] = useState([]);

    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [Verifying, setVerifying] = useState(false);
    const [age, setAge] = useState('');

    const handleChange = (event: SelectChangeEvent) => {
      setChoice(event.target.value);
    };

    const [rows, setRows] = useState<Number [][]>([]);


    const submit = async (event: any) => {
        if(betsCount>=10){
          throw new Error("Cannot have more than 10 bets.");
        }
        else
        {
            event.preventDefault();
            setError(false);
            setBetsChoices([...betsChoices, [BigInt(bet), BigInt(choice)]]);
            console.log("Inside Submit", bet, choice, betsChoices);
            setRows([...rows, createData(betsCount, Number(choice), Number(bet))]);
            event.preventDefault();
            setBetsCount(betsCount+1);
        }
    }

    const verify = async (event: any) => {


      if (betsCount === 10){
          event.preventDefault();
          setError(false);

          setVerifying(true);
          var odds0 = 0n;
          var odds1 = 0n;
          for(var i=0; i<betsChoices.length; i++){

              if(betsChoices[i][1] === 0n){
                odds0 += betsChoices[i][0]
              }

              else if(betsChoices[i][1] === 1n){
                odds1 += betsChoices[i][0]
              }

          }
          setC(await verifyProof({"betsChoices": betsChoices,
                                  "minBet": 5n,
                                  "depositMin": 100n,
                                  "odds0": odds0,
                                  "odds1": odds1})
                                  .catch((error: any) => {
                  setErrorMsg(error.toString());
                  setError(true);
                  setVerifying(false);
              }));
          setVerifying(false);
          event.preventDefault();
          console.log("C***:", c);

      }
      else {
        throw new Error("You need exactly 10 bets to verify the proof");
      }
    }

    const betHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value !== "") {
            setBet(event.target.value);
        }
    };

    const enterHandler = async (event: any) => {
        if (event.which === "13") {
            event.preventDefault();
        }
    };


    const keyHandler = async (event: any) => {
        if (['e', 'E', '+', '.', 'Enter'].includes(event.key)) {
            event.preventDefault();
        }
    };

    return (
        <Box
            component="form"
            sx={{
                "& .MuiTextField-root": { m: 1, width: "25ch" },
                width: "99%", maxWidth: 600, margin: 'auto'
            }}
            noValidate
            autoComplete="off"
            textAlign="center">
            <div>
              <FormControl sx={{ m: 1, minWidth: 80 }}>
                <InputLabel id="demo-simple-select-autowidth-label">Choice</InputLabel>
                <Select
                  labelId="demo-simple-select-autowidth-label"
                  id="demo-simple-select-autowidth"
                  value={choice}
                  onChange={handleChange}
                  autoWidth
                  label="Choice"
                >
                  <MenuItem value={0}>Team A - 0</MenuItem>
                  <MenuItem value={1}>Team B - 1</MenuItem>
                </Select>
              </FormControl>
            </div>
            <TextField
                id="input-bet"
                label="Bet"
                type="number"
                InputLabelProps={{
                    shrink: true,
                }}
                variant="filled"
                value= {bet}
                onKeyDown={keyHandler}
                onChange={betHandler}
                onKeyPress={enterHandler}
            /><br />

            <Button
                onClick={submit}
                variant="contained">
                Submit
            </Button>
            <br /><br />
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 450 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Choice</TableCell>
                    <TableCell align="right">Bet</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={String(row[0])}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row[1]}
                      </TableCell>
                      <TableCell align="right">{row[2]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <br /> <br />
            <Button
                onClick={verify}
                variant="contained">
                Verify
            </Button>
            <br /><br />
            {Verifying ? <Loading text="Verifying proof..." /> : <div />}
            {error ? <Alert severity="error" sx={{ textAlign: "left" }}>{errorMsg}</Alert> : <div />}
            <Typography>{c[0]}:{c[1]} Verified!</Typography>
        </Box>
    );
}
