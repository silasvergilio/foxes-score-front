import { Component } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { BalLGame } from '../../interfaces/game.interface';
import { MatIconModule } from '@angular/material/icon';
import { LineAnimationComponent } from '../../components/line-animation/line-animation.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { GameIndicatorComponent } from '../../components/game-indicator/game-indicator.component';

@Component({
  selector: 'game-score',
  imports: [MatCardModule, CommonModule, MatIconModule, LineAnimationComponent,MatProgressSpinnerModule, GameIndicatorComponent],
  templateUrl: './game-score.component.html',
  styleUrl: './game-score.component.scss',
})
export class GameScoreComponent {

  game: BalLGame = {
    id: "1",
    tournament: "CBA AA",
    location: "ANC",
    date: "13/04/2025",
    startedTime: "09:00",
    status: "finalizado",
    startOffense: "Foxes",
    startDefense: "Furai Banzai",
    startOffenseScore: 5,
    startDefenseScore: 2,
    firstBaseRunner: false,
    secondBaseRunner: true,
    thirdBaseRunner: false,
    balls: 3,
    strikes: 2,
    outs: 1,
    inning: 1,
    inningHalf: true
  }


  constructor(private socket: Socket) {}

  ngOnInit() {
    this.socket.fromEvent('gameUpdate').subscribe((data) => {
      console.log("data", data);
      this.game = data
    });

    // this.socket.on('message', (data) => {
    //   console.log(data);
    // });
  }
}
