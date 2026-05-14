import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PlayerStats } from '../../interfaces/player-stats.interface';
import { FormatNamePipe } from '../../pipes/formatName.pipe';
import { MatFormField, MatLabel, MatSelect, MatOption } from "@angular/material/select";
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';


const PLAYER_DATA: PlayerStats[] = [
  {
    name: 'MARIO_VINICIUS_MELO_REINA MANDRUZATTO',
    G: 2,
    PA: 6,
    AB: 6,
    R: 1,
    H: 4,
    HR: 0,
    TB: 6,
    RBI: 4,
    AVG: 0.667,
    BB: 0,
    SO: 2,
    HBP: 0,
    SB: 1,
    CS: 0,
    SCB: 0,
    SF: 0,
    SLG: 1.000,
    BA_RSP: 1.000
  }
];


@Component({
  selector: 'app-stats',
  imports: [MatTableModule, FormatNamePipe, MatFormField, MatLabel, MatSelect, MatOption, MatTabsModule, MatIconModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',

})
export class StatsComponent {
  displayedColumns = [
    'name', 'G', 'PA', 'AB', 'R', 'H', 'HR', 'TB', 'RBI', 'AVG',
    'BB', 'SO', 'HBP', 'SB', 'CS', 'SCB', 'SF', 'SLG', 'BA_RSP'
  ]; dataSource = PLAYER_DATA;



}




