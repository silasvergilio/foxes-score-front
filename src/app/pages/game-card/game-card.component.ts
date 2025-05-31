import { Component, Input } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ActivatedRoute } from '@angular/router'; // 👈 IMPORTANTE
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { BallGame } from '../../interfaces/game.interface';
import { MatIconModule } from '@angular/material/icon';
import { LineAnimationComponent } from '../../components/line-animation/line-animation.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GameIndicatorComponent } from '../../components/game-indicator/game-indicator.component';
import { ChatService } from '../../services/chat.service';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'game-card',
  imports: [
    MatCardModule,
    CommonModule,
    MatIconModule,
    LineAnimationComponent,
    MatProgressSpinnerModule,
    GameIndicatorComponent,
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.scss',
})
export class GameCardComponent {
  game: BallGame | undefined;
  idFromUrl!: string; // 👈 variável para armazenar o id

  constructor(
    private socket: Socket,
    private chat: ChatService,
    private route: ActivatedRoute,
    private api: ApiService,
    private loader: LoaderService
  ) {}

  ngOnInit() {
    // Pegando o ID da URL
    this.idFromUrl = this.route.snapshot.paramMap.get('id') || '';


    this.loader.start();
    this.api.get<BallGame>(`game/${this.idFromUrl}`).subscribe((data) => {
      this.game = data;
      this.loader.stop();
    });

    this.socket.on('gameUpdate', (data) => {
      this.game = data;
    });
  }
}
