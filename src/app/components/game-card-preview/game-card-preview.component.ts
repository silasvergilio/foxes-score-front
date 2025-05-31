import { Component, Input } from '@angular/core';
import { BallGame } from '../../interfaces/game.interface';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'game-card-preview',
  imports: [MatCardModule,CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './game-card-preview.component.html',
  styleUrl: './game-card-preview.component.scss'
})
export class GameCardPreviewComponent {

  constructor(private router: Router) {}
  @Input() game: BallGame | undefined;


  public navigate(type: boolean) {

  this.router.navigate([`${type ? 'game-adm' : 'game'}/${this.game?._id}`]);
  }
}
