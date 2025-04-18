import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-indicator',
  imports: [CommonModule],
  templateUrl: './game-indicator.component.html',
  styleUrl: './game-indicator.component.scss',
})
export class GameIndicatorComponent {
  @Input() status: string = 'ativo'
}