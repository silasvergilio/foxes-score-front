import { Component, Input } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { BallGame } from '../../interfaces/game.interface';
import { MatIconModule } from '@angular/material/icon';
import { LineAnimationComponent } from '../../components/line-animation/line-animation.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GameIndicatorComponent } from '../../components/game-indicator/game-indicator.component';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'game-card-adm',
  imports: [
    MatCardModule,
    CommonModule,
    MatIconModule,
    LineAnimationComponent,
    MatProgressSpinnerModule,
    GameIndicatorComponent,
    MatButtonModule,
  ],
  templateUrl: './game-card-adm.component.html',
  styleUrl: './game-card-adm.component.scss',
})
export class GameCardAdminComponent {
  constructor(
    private socket: Socket,
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  game: BallGame | undefined;
  idFromUrl!: string; // 👈 variável para armazenar o id

  ngOnInit() {
    // Pegando o ID da URL
    this.idFromUrl = this.route.snapshot.paramMap.get('id') || '';

    this.api.get<BallGame>(`game/${this.idFromUrl}`).subscribe((data) => {
      this.game = data;
    });
  }

  public updateGame(obj: BallGame): BallGame {
    if (obj.balls > 3) {
      obj.balls = 0;
      obj.strikes = 0;
    }

    if (obj.strikes > 2) {
      obj.strikes = 0;
      obj.outs++;
    }

    if (obj.outs > 2) {
      obj.firstBaseRunner = false;
      obj.secondBaseRunner = false;
      obj.thirdBaseRunner = false;
      obj.outs = 0;
      if (obj.inningHalf) {
        obj.inningHalf = false;
        obj.inning++;
      } else {
        obj.inningHalf = true;
      }
    }

    return obj;
  }

  public updateValue<T extends Record<string, any>>(
    obj: T,
    key: keyof T,
    amount: number,
    operation: 'add' | 'subtract',
    min: number
  ): void {
    if (typeof obj[key] === 'number') {
      const currentValue = obj[key] as number;
      const newValue =
        operation === 'add' ? currentValue + amount : currentValue - amount;

      // Impede valor negativo
      // var copyObj = { ...obj };
      obj[key] = Math.max(min, newValue) as T[keyof T];
      obj = this.updateGame(obj as unknown as BallGame) as unknown as T;

      this.api.put<any>('game', obj).subscribe((data) => {
        console.log('data', data);
      });
    } else {
      throw new Error(`Property "${String(key)}" is not a number.`);
    }
  }
  public toggleField<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    key: K
  ): void {
    if (typeof obj[key] === 'boolean') {
      obj[key] = !obj[key] as T[K];
      this.api.put<any>('game', obj).subscribe((data) => {
        console.log('data', data);
      });
    } else {
      throw new Error(`Property "${String(key)}" is not a boolean.`);
    }
  }
}
