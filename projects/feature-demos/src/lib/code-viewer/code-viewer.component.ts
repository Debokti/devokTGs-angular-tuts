import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CodeFile {
  name: string;
  code: string;
  language: 'typescript' | 'html' | 'scss';
}

@Component({
  selector: 'lib-code-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './code-viewer.component.html',
  styleUrls: ['./code-viewer.component.scss']
})
export class CodeViewerComponent implements OnInit {
  @Input() files: CodeFile[] = [];
  activeFileIndex = 0;
  copied = false;
  activeCode = '';

  ngOnInit(): void {
    this.updateActiveCode();
  }

  selectFile(index: number): void {
    this.activeFileIndex = index;
    this.updateActiveCode();
  }

  updateActiveCode(): void {
    if (!this.files || this.files.length === 0) return;
    const file = this.files[this.activeFileIndex];
    this.activeCode = file.code;
  }

  copyCode(): void {
    if (!this.files || this.files.length === 0) return;
    const code = this.files[this.activeFileIndex].code;
    navigator.clipboard.writeText(code).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

}
