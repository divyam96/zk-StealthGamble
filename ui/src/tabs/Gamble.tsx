import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { getGameInfo, getMinBet, depositHashCommitment } from "../contract";
import Loading from "./components/Loading";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Paper from '@mui/material/Paper';








export default function Upload() {
    const [bet, setBet] = useState('6');
    const [choice, setChoice] = useState('0');
    const [betsCount, setBetsCount] = useState(0);

    const [team0, setTeam0] = useState('');
    const [team1, setTeam1] = useState('');
    const [league, setLeague] = useState('');
    const [venue, setVenue] = useState('');
    const [date, setDate] = useState('');
    const [odds0, setOdds0] = useState('');
    const [odds1, setOdds1] = useState('');
    const [minBet, setMinBet] = useState('');


    const [Submitting, setSubmitting] = useState(false);
    const [Submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (event: SelectChangeEvent) => {
      setChoice(event.target.value);
    };


    useEffect(() => {
      // 👇️ this only runs once
      async function getData() {
           var info_odds_0, info_odds_1, info_startTime, info_endTime,
           info_balance, info_team0, info_team1, info_league,
           info_venue, info_fixture_id, info_participantCount, info_rewardsDistributed;

           const info = await getGameInfo();
           const minBet = await getMinBet();

           [info_odds_0, info_odds_1, info_startTime, info_endTime,
            info_balance, info_team0, info_team1, info_league, info_venue,
            info_fixture_id, info_participantCount, info_rewardsDistributed] = info;

           var date = new Date(info_startTime.toNumber()*1000);
           var date_str = "Date: "+date.getDate()+
                          "/"+(date.getMonth()+1)+
                          "/"+date.getFullYear()+
                          " Time: "+date.getHours()+
                          ":"+date.getMinutes()+" UTC"


           console.log("Contract Balance", info_balance.toString());
           setTeam0(info_team0);
           setTeam1(info_team1);
           setLeague(info_league);
           if(info_venue != "null, null"){
              setVenue(info_venue);
           }
           setDate(date_str);
           setOdds0(info_odds_0.toString());
           setOdds1(info_odds_1.toString());
           setMinBet(minBet.toString());
           setBetsCount(info_participantCount.toNumber());



     }
    getData().catch((error: any) => {
      setErrorMsg(error.toString());
      setError(true);
      });

    }, []);

    async function submitCommitment(){
      if(betsCount>=10){
        throw new Error("Cannot have more than 10 bets.");
      }
      else
      {   if(BigInt(bet)<BigInt(minBet)){
            throw new Error("Betting amount cannot be less than " + minBet);

          }
          const userBetChoice: bigint[] = [BigInt(bet), BigInt(choice)];
          console.log(userBetChoice);
          await depositHashCommitment(userBetChoice);
          setBetsCount(betsCount+1);
        }

    }


    const submit = async (event: any) => {

        setSubmitting(true);
        setSubmitted(true);
        await submitCommitment().catch((error: any) => {
          setErrorMsg(error.toString());
          setError(true);
          setSubmitting(false);
          setSubmitted(false);
          });

        console.log("Error", error)
        setSubmitting(false);
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
              width: "99%", maxWidth: 900, margin: 'auto'
          }}
          noValidate
          autoComplete="off"
          textAlign="center">
          <Typography variant="h4" gutterBottom component="div">
           ZkStealthGamble
         </Typography>
          <Typography variant="h6" gutterBottom component="div">
           Place Bets Privately
         </Typography>
         <Paper elevation={15}>
          <Typography variant="h3" gutterBottom component="div">
           {league}
        </Typography>
        <Typography variant="h4" gutterBottom component="div">
          {team0} vs {team1}
        </Typography>
        <Typography variant="h5" gutterBottom component="div">
        {date} <br/> {venue}
        </Typography>
        </Paper>
        <Paper>
        <Typography variant="h4" gutterBottom component="div">
        Pot for {team0}: {odds0} <br/> Pot for {team1}: {odds1}
        </Typography>
        <Typography variant="h6" gutterBottom component="div">
        {betsCount} / 10 Bets Placed
        </Typography>
        </Paper>
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
                <MenuItem value={0}>{team0} - 0</MenuItem>
                <MenuItem value={1}>{team1}- 1</MenuItem>
              </Select>
            </FormControl>
          </div>
          <Typography>
          Deposit: 100(fixed),   Min Bet: {minBet}(increases every 6 hrs)
          </Typography>
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
          {Submitting? <Loading text="Submitting Bet..." /> : <div />}
          {error ? <Alert severity="error" sx={{ textAlign: "left" }}>{errorMsg}</Alert> : <div />}
          {Submitted? <Typography>Submitted!{Submitted}</Typography> : <div />}
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header">
              <Typography>Rules of Game</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography align="left">
              <br/><br/>1. A fixed amount of 100 ONE will be taken as
              deposit when the bet is successfully submitted.
               The betting amount must always be less than the deposit.
              <br/><br/>2. Only whole integer bets are accepted.
              <br/><br/>3. Each player(i.e. Account) can participate only once
              and cannot withdraw a deposit once submitted.
              <br/><br/>4. The betting period is 24-48hrs. Those who bet on the
               day of the game will have a higher min Bet.
              <br/><br/>5. Odds will be refreshed at the start of each day.
              Min bet is increased with this refresh.
              <br/><br/>6. Gas fees are not refunded and act as participation
               fees. Amount equalling “Deposit-Bet-gasfees” will be returned to
                each user at the end of the event along with wins(if any).
              <br/><br/>7. Wins are distributed as per the proportion of stake
               of each winning participant in the winning pot. For example,
                let's assume the winning pot has 250 ONE and the losing pot
                 has 300 ONE.  The participant has bet 25 ONE in the winning
                  pot amounting to 25/250 i.e. 10% contribution. This means
                   that the participant will receive 10% of the losing pot as
                    the reward amount(10% of 300 ONE is 30).

              </Typography>
            </AccordionDetails>
          </Accordion>
      </Box>

  );
}
