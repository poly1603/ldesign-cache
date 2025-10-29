# @ldesign/cache-angular

> LDesign Cache 的 Angular 集成包 - Services 和 Module

[![npm version](https://img.shields.io/npm/v/@ldesign/cache-angular.svg)](https://www.npmjs.com/package/@ldesign/cache-angular)
[![license](https://img.shields.io/npm/l/@ldesign/cache-angular.svg)](https://github.com/ldesign/ldesign/blob/main/LICENSE)

## 特性

- 🎯 **Angular Services** - 完整的 Angular 依赖注入支持
- 🔄 **RxJS Integration** - 返回 Observable
- 📦 **Module** - 开箱即用的 NgModule
- ⚡ **类型安全** - 完整的 TypeScript 支持

## 安装

```bash
pnpm add @ldesign/cache-angular @ldesign/cache-core
```

## 快速开始

```typescript
import { Component } from '@angular/core'
import { CacheService } from '@ldesign/cache-angular'

@Component({
  selector: 'app-user-profile',
  template: `
    <div *ngIf="loading">Loading...</div>
    <div *ngIf="user">{{ user.name }}</div>
  `,
})
export class UserProfileComponent {
  user: any
  loading = true

  constructor(private cache: CacheService) {
    this.loadUser()
  }

  loadUser() {
    this.cache.remember('user', () => 
      fetch('/api/user').then(r => r.json())
    ).subscribe({
      next: (data) => {
        this.user = data
        this.loading = false
      },
    })
  }
}
```

## 许可证

MIT License © LDesign Team

