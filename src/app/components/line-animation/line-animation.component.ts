import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-animate-line',
  templateUrl: './line-animation.component.html',
  styleUrls: ['./line-animation.component.scss'],
})
export class LineAnimationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef;
  @Input() width = 0;
  left = 0;
  private containerWidth = 0;
  private animationFrameId = 0;
  private direction: 'forward' | 'backward' = 'forward';
  private speed = 3;

  ngAfterViewInit(): void {
    const container = this.containerRef.nativeElement as HTMLElement;
    this.containerWidth = container.offsetWidth;
    this.animate();
  }

  animate(): void {
    const step = () => {
      if (this.direction === 'forward') {
        if (this.width < this.containerWidth) {
          this.width += this.speed;
        } else {
          this.direction = 'backward';
        }
      } else {
        if (this.left < this.containerWidth) {
          this.left += this.speed;
          this.width = this.containerWidth - this.left;
        } else {
          // Reset to start
          this.left = 0;
          this.width = 0;
          this.direction = 'forward';
        }
      }

      this.animationFrameId = requestAnimationFrame(step);
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
  }
}