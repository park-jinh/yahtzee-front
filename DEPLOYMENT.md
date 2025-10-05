# 🚀 Yahtzee Game 배포 가이드

## 📦 배포 옵션

### 1️⃣ GitHub Pages (무료, 추천)

**장점:**
- 완전 무료
- HTTPS 자동 지원
- 자동 배포 (GitHub Actions)
- 커스텀 도메인 가능

**배포 단계:**

1. **GitHub 저장소 생성**
   ```bash
   # GitHub에서 새 저장소 생성 후
   git remote add origin https://github.com/YOUR_USERNAME/yahtzee-game.git
   git branch -M main
   git push -u origin main
   ```

2. **GitHub Pages 활성화**
   - GitHub 저장소 → Settings → Pages
   - Source: "GitHub Actions" 선택
   - 자동으로 `.github/workflows/deploy.yml` 워크플로우 실행

3. **배포 완료!**
   - URL: `https://YOUR_USERNAME.github.io/yahtzee-game/`
   - 푸시할 때마다 자동 배포

**⚠️ 중요:** `vite.config.ts`의 `base` 경로를 저장소 이름과 일치시키세요:
```typescript
base: '/yahtzee-game/'  // 저장소 이름과 동일하게
```

---

### 2️⃣ Vercel (무료, 가장 빠름)

**장점:**
- 초고속 글로벌 CDN
- 자동 HTTPS
- 프리뷰 URL
- 무료 도메인 제공

**배포 단계:**

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 임포트**
   - "New Project" 클릭
   - GitHub 저장소 선택
   - Framework Preset: Vite 자동 감지
   - "Deploy" 클릭

3. **배포 완료!**
   - URL: `https://yahtzee-game.vercel.app`
   - 푸시할 때마다 자동 배포

**설정:**
```bash
# Vercel CLI로 배포 (선택)
npm i -g vercel
vercel
```

---

### 3️⃣ Netlify (무료)

**장점:**
- 간단한 배포
- 자동 HTTPS
- 폼/함수 지원
- 무료 도메인

**배포 단계:**

1. **Netlify 계정 생성**
   - https://netlify.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 임포트**
   - "Add new site" → "Import an existing project"
   - GitHub 저장소 선택
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - "Deploy" 클릭

3. **배포 완료!**
   - URL: `https://yahtzee-game.netlify.app`

---

### 4️⃣ Cloudflare Pages (무료)

**장점:**
- 무제한 대역폭
- 초고속 글로벌 네트워크
- 자동 HTTPS
- 무료 도메인

**배포 단계:**

1. **Cloudflare 계정 생성**
   - https://pages.cloudflare.com 접속
   - 계정 생성

2. **프로젝트 연결**
   - "Create a project"
   - GitHub 저장소 연결
   - Build settings:
     - Build command: `npm run build`
     - Build output: `dist`
   - "Save and Deploy"

3. **배포 완료!**
   - URL: `https://yahtzee-game.pages.dev`

---

### 5️⃣ 자체 서버 배포

**Node.js 서버:**

```bash
# 1. 빌드
npm run build

# 2. dist 폴더를 서버에 업로드
scp -r dist/* user@your-server:/var/www/yahtzee-game/

# 3. Nginx 설정 예시
server {
    listen 80;
    server_name yahtzee.yourdomain.com;
    root /var/www/yahtzee-game;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache 설정:**

```apache
<VirtualHost *:80>
    ServerName yahtzee.yourdomain.com
    DocumentRoot /var/www/yahtzee-game

    <Directory /var/www/yahtzee-game>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA 라우팅 지원
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

**Docker 배포:**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# 빌드 및 실행
docker build -t yahtzee-game .
docker run -d -p 80:80 yahtzee-game
```

---

## 🔄 업데이트 및 재배포

**GitHub Pages / Vercel / Netlify:**
```bash
git add .
git commit -m "Update game"
git push
# 자동으로 배포됨
```

**자체 서버:**
```bash
npm run build
scp -r dist/* user@server:/var/www/yahtzee-game/
```

---

## 🌐 커스텀 도메인 연결

**GitHub Pages:**
1. 저장소 Settings → Pages → Custom domain
2. DNS 설정:
   ```
   CNAME 레코드: www.yourdomain.com → YOUR_USERNAME.github.io
   A 레코드: yourdomain.com → 185.199.108.153
   ```

**Vercel/Netlify:**
1. 프로젝트 Settings → Domains
2. 도메인 추가하고 DNS 설정 따라하기

---

## ✅ 배포 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 있는지 확인
- [ ] `vite.config.ts`의 `base` 경로 확인
- [ ] 로컬에서 `npm run build` 테스트
- [ ] `dist` 폴더가 정상 생성되는지 확인
- [ ] 배포 후 실제 URL에서 게임 테스트
- [ ] 모바일/데스크톱 반응형 확인
- [ ] HTTPS 작동 확인

---

## 🆘 문제 해결

**빌드 실패:**
```bash
# 캐시 삭제 후 재시도
rm -rf node_modules package-lock.json
npm install
npm run build
```

**페이지가 로드되지 않음:**
- `vite.config.ts`의 `base` 경로 확인
- 브라우저 콘솔에서 에러 확인
- Network 탭에서 404 에러 확인

**GitHub Actions 실패:**
- Actions 탭에서 에러 로그 확인
- Settings → Pages에서 소스가 "GitHub Actions"인지 확인

---

## 📊 추천 배포 방법

| 용도 | 추천 플랫폼 | 이유 |
|------|-----------|------|
| 개인 프로젝트 | **GitHub Pages** | 무료, 간단, GitHub 통합 |
| 프로덕션 | **Vercel** | 최고 성능, 프리뷰 URL |
| 대규모 트래픽 | **Cloudflare Pages** | 무제한 대역폭 |
| 자체 관리 | **자체 서버** | 완전한 제어 |

---

**현재 프로젝트는 GitHub Pages 자동 배포가 설정되어 있습니다.**
푸시만 하면 자동으로 배포됩니다! 🎉
