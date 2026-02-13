# GitHub SSH Setup for Boar Park Server

## ✅ SSH Key Generated

**Public Key to add to GitHub:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHJ2zVBmjWfxflM4G8+74rE6HVJpGvfDC6JJgh2IOilq dmverma97@gmail.com
```

## 📋 Steps to Complete

### 1. Add SSH Key to GitHub (on your laptop)

1. Go to: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Title: `Boar Park Server`
4. Paste this key:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHJ2zVBmjWfxflM4G8+74rE6HVJpGvfDC6JJgh2IOilq dmverma97@gmail.com
   ```
5. Click **"Add SSH key"**

### 2. Test Connection (on server)

```bash
ssh -T git@github.com
```

Should say: `Hi SuperBoar-Games! You've successfully authenticated...`

### 3. Push Your Branch (on server)

```bash
cd /mnt/data/boar-park
git push -u origin dmv_task_ui
```

### 4. Create Pull Request

Go to: https://github.com/SuperBoar-Games/boar-park/pulls

Or use GitHub CLI:
```bash
gh pr create --title "Add marketing website with e-commerce" \
  --body "- Landing page for Boar Park
- Shopping cart & checkout
- Order tracking system
- Docker/K8s deployment configs"
```

## 🔐 Key Files

- Private key: `~/.ssh/github_boarpark`
- Public key: `~/.ssh/github_boarpark.pub`
- SSH config: `~/.ssh/config`

## 📝 Note

The git remote has been updated to use SSH:
- Old: `https://github.com/SuperBoar-Games/boar-park.git`
- New: `git@github.com:SuperBoar-Games/boar-park.git`
