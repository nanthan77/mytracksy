# 🌐 Custom Domain Setup: www.mytracksy.com

## 📋 Complete Setup Guide

### Step 1: Add Domain in Firebase Console

1. **Go to Firebase Hosting**: https://console.firebase.google.com/project/tracksy-8e30c/hosting
2. **Click "Add custom domain"** button
3. **Enter your domain**: `www.mytracksy.com`
4. **Click "Continue"**

### Step 2: Domain Verification

Firebase will ask you to verify domain ownership:

1. **Add TXT record** to your DNS:
   - **Type**: TXT
   - **Name**: `@` or root domain
   - **Value**: (Firebase will provide this)
   - **TTL**: 3600 or default

2. **Wait for verification** (can take up to 24 hours)
3. **Click "Verify"** in Firebase Console

### Step 3: DNS Configuration

After verification, configure these DNS records:

#### Option A: CNAME Record (Recommended)
```
Type: CNAME
Name: www
Value: tracksy-8e30c.web.app
TTL: 3600
```

#### Option B: A Records (If CNAME not supported)
```
Type: A
Name: www
Value: 199.36.158.100
TTL: 3600

Type: A  
Name: www
Value: 199.36.158.101
TTL: 3600
```

### Step 4: SSL Certificate

Firebase automatically provisions SSL certificates:
- **Automatic**: Firebase generates Let's Encrypt SSL
- **Time**: Usually takes 24-48 hours
- **Status**: Check in Firebase Console

### Step 5: Redirect Setup (Optional)

To redirect `mytracksy.com` to `www.mytracksy.com`:

1. **Add both domains** to Firebase
2. **Set up redirect** in DNS or hosting provider
3. **Or use Firebase redirect rules**

## 🔧 DNS Provider Instructions

### Common DNS Providers:

#### Cloudflare
1. **Dashboard** → **DNS** → **Records**
2. **Add Record**:
   - Type: CNAME
   - Name: www
   - Target: tracksy-8e30c.web.app
   - Proxy status: DNS only (gray cloud)

#### GoDaddy
1. **DNS Management**
2. **Add Record**:
   - Type: CNAME
   - Host: www
   - Points to: tracksy-8e30c.web.app
   - TTL: 1 Hour

#### Namecheap
1. **Advanced DNS**
2. **Add New Record**:
   - Type: CNAME Record
   - Host: www
   - Value: tracksy-8e30c.web.app
   - TTL: Automatic

#### Google Domains
1. **DNS Settings**
2. **Custom records**:
   - Type: CNAME
   - Name: www
   - Data: tracksy-8e30c.web.app
   - TTL: 1H

## 🎯 Expected Timeline

- **Domain Verification**: 1-24 hours
- **DNS Propagation**: 1-48 hours  
- **SSL Certificate**: 24-48 hours
- **Total Setup Time**: 1-3 days

## 🔍 Troubleshooting

### Common Issues:

**Domain not verifying:**
- Wait 24 hours for DNS propagation
- Check TXT record is correct
- Remove old DNS records

**SSL certificate pending:**
- Wait 48 hours
- Ensure DNS is correctly configured
- Check for conflicting records

**Site not loading:**
- Verify CNAME points to tracksy-8e30c.web.app
- Check DNS propagation: https://dnschecker.org
- Clear browser cache

### Check Domain Status:
```bash
# Check DNS propagation
nslookup www.mytracksy.com

# Check SSL certificate
openssl s_client -connect www.mytracksy.com:443 -servername www.mytracksy.com
```

## 📊 Verification Commands

### Test Domain Resolution:
```bash
dig www.mytracksy.com
dig CNAME www.mytracksy.com
```

### Test SSL Certificate:
```bash
curl -I https://www.mytracksy.com
```

### Check Firebase Status:
```bash
firebase hosting:sites:get tracksy-8e30c
```

## 🎉 Success Indicators

When setup is complete, you should see:
- ✅ Domain verification: Complete
- ✅ SSL certificate: Provisioned  
- ✅ DNS resolution: Points to Firebase
- ✅ Site loads: https://www.mytracksy.com
- ✅ Automatic redirect: HTTP → HTTPS

## 📞 Support Resources

- **Firebase Hosting Docs**: https://firebase.google.com/docs/hosting/custom-domain
- **DNS Propagation Checker**: https://dnschecker.org
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
- **Firebase Support**: https://firebase.google.com/support

---

## 🎯 Quick Setup Checklist

- [ ] Add domain in Firebase Console
- [ ] Verify domain ownership (TXT record)
- [ ] Configure DNS (CNAME record)
- [ ] Wait for SSL certificate
- [ ] Test site: https://www.mytracksy.com
- [ ] Update application configs with new domain

**Once complete, your MyTracksy platform will be accessible at:**
**🌐 https://www.mytracksy.com**