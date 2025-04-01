import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { BalLGame } from './interfaces/game.interface';

@Component({
  selector: 'app-root',
  imports: [MatCardModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {

  game: BalLGame = {
    id: '1',
    awayTeam: "UnderDogs",
    homeTeam: "Foxes",
    awayScore: 0,
    homeScore: 0,
    firstBaseRunner: false,
    secondBaseRunner: false,
    thirdBaseRunner: false,
    balls: 0,
    strikes: 0,
    outs: 0,
    inning: 1,
    inningHalf: 'Top',
  };
  title = 'foxes-score-front';
  awayScore = 0;
  homeScore = 1;
  firstBaseRunner = true;
  secondBaseRunner = true;
  thirdBaseRunner = true;
  balls = 0;
  strikes = 0;
  outs = 0;
  inning = 1;
  inningHalf = 'Top';

  constructor(private socket: Socket) {}

  ngOnInit() {
    this.socket.fromEvent('gameUpdate').subscribe((data) => {
      this.game = data
    });

    // this.socket.on('message', (data) => {
    //   console.log(data);
    // });
  }
}
