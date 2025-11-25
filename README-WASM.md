# Open Pages - WASM Edition 🦀🌐

A self-contained web application for academic research papers, powered by WebAssembly and following the [Zig docs approach](https://github.com/ziglang/zig/tree/master/doc).

## 🌟 What is this?

This is a **complete reimplementation** of Open Pages that processes content entirely in the browser using WebAssembly. Instead of pre-generating JSON files on a server, it:

1. Downloads a WASM module and a `sources.tar` file
2. Extracts and processes your markdown papers in real-time
3. Renders the exact same beautiful UI you're used to

**Zero server-side processing required!**

## 🎯 Key Features

- **📦 Self-contained**: Single WASM module + sources archive
- **🎨 UI preserved**: Exact same design, themes, and functionality  
- **🌐 Deploy anywhere**: GitHub Pages, Netlify, S3, any static hosting
- **⚡ Fast**: Near-native processing speed in the browser
- **🔄 Offline capable**: Works without internet after first load
- **♻️ Zero dependencies**: No Node.js, no npm, no maintenance

## 🏗️ Architecture

```
dist-wasm/                        # Ready-to-deploy directory
├── pkg/
│   ├── open_pages_processor_bg.wasm    # 1.2MB compiled processor
│   └── open_pages_processor.js         # JS bindings
├── sources.tar                         # 10KB archive with papers
├── index.html                          # Your exact UI
└── dist/css/                          # All themes & styles
    ├── style.css
    ├── theme-default.css
    ├── theme-maple.css
    └── theme-moka.css
```

## 🚀 Quick Start

### Build WASM Version
```bash
./build-wasm.sh
```

### Test Locally  
```bash
cd dist-wasm && python3 -m http.server 8000
# Open http://localhost:8000
```

### Deploy to Production
```bash
# Upload dist-wasm/ directory to any static hosting
rsync -av dist-wasm/ user@server:/var/www/
```

## 📊 Comparison

| Aspect | Node.js Version | WASM Version |
|--------|-----------------|--------------|
| **Dependencies** | Node.js + 30MB npm | None |
| **Processing** | Server-side build | Browser-side runtime |
| **Hosting** | Any web server | Static hosting only |
| **Scalability** | Server dependent | Infinite (CDN) |
| **Offline** | No | Yes |
| **Bundle Size** | Variable + deps | 1.3MB total |
| **Maintenance** | NPM security updates | Zero |

## 🧪 Testing

Run the test suite:
```bash
./test-wasm.sh
```

This verifies:
- ✅ All required files are present
- ✅ WASM module loads correctly  
- ✅ Sources archive is valid
- ✅ Themes work properly
- ✅ Local server functionality

## 🎨 Themes

All your existing themes work exactly as before:
- **Default**: Dark theme with blue accents
- **Maple**: Warm theme with maple colors  
- **Moka**: Rich coffee-inspired theme

Theme switching is preserved and uses localStorage for persistence.

## 📤 Deployment Options

### GitHub Pages (Automated)
The included `.github/workflows/deploy.yml` automatically:
1. Builds the WASM version on push
2. Deploys to GitHub Pages
3. No configuration needed!

### Manual Deployment
```bash
# Build
./build-wasm.sh

# Deploy to any static host
scp -r dist-wasm/* user@yourserver:/var/www/html/

# Or use your hosting provider's upload tool
```

### CDN-Optimized
Since everything is static, you can:
- Enable aggressive caching (WASM files rarely change)
- Use edge locations for global speed
- Implement progressive loading strategies

## 🔧 Development

### Project Structure
```
open-pages/
├── papers/                    # Your markdown papers
├── tools/web-processor/       # Rust/WASM build system
├── dist-wasm/               # Generated output
├── build-wasm.sh            # Main build script
└── test-wasm.sh             # Test suite
```

### Adding Papers
Just add `.md` files to `papers/` with frontmatter:
```markdown
---
title: "Your Paper Title"
authors:
  - name: "Author Name"
    affiliation: "Institution"
tags:
  - "Tag1"
  - "Tag2"
status: working
---

## Summary
Your paper summary...
```

Then rebuild:
```bash
./build-wasm.sh
```

### Modifying the Processor
The WASM processor is in `tools/web-processor/src/lib.rs`. After changes:
```bash
./build-wasm.sh  # Rebuilds WASM automatically
```

## 🌍 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support (iOS 11.3+)
- **Mobile**: Full support

WebAssembly is [widely supported](https://caniuse.com/wasm) across all modern browsers.

## 🔍 How It Works

1. **Page loads** → Downloads WASM module and sources.tar
2. **WASM initializes** → Creates paper processor instance
3. **Archive extraction** → Parses tar file in browser
4. **Content processing** → Converts markdown to HTML in real-time
5. **UI rendering** → Your exact same interface appears
6. **Interaction** → Search, filter, themes work as normal

All processing happens in the browser using near-native WebAssembly performance.

## 🧹 Migration from Node.js

If migrating from the Node.js version:

1. **Build WASM version**: `./build-wasm.sh`
2. **Test thoroughly**: `./test-wasm.sh`
3. **Clean up old files**: `./cleanup-nodejs.sh` 
4. **Update CI/CD**: Use the new workflow
5. **Deploy**: Upload `dist-wasm/`

The cleanup script removes:
- `node_modules/`, `package.json`
- `build.js`, `build.sh` 
- Generated `dist/` files

## 📈 Performance

- **WASM module**: 1.2MB (gzip: ~400KB)
- **Sources archive**: 10KB+ (scales with content)
- **First load**: ~2s on fast connections
- **Subsequent loads**: Instant (cached)
- **Processing speed**: Near-native performance

## 🤔 Why WASM?

Following the [Zig documentation approach](https://github.com/ziglang/zig/blob/master/doc/docgen.zig):

1. **Self-contained**: Everything needed is in the download
2. **Version lockstep**: Content and processor always match  
3. **Zero servers**: Deploy to CDNs, edge locations, anywhere
4. **Offline capable**: Progressive web app potential
5. **Future-proof**: WebAssembly is a web standard

## 📚 References

- [WebAssembly Documentation](https://webassembly.org/)
- [Zig Docs Implementation](https://github.com/ziglang/zig/tree/master/doc)
- [wasm-pack Guide](https://rustwasm.github.io/wasm-pack/)

## 🆘 Troubleshooting

**WASM not loading?**
- Check browser dev tools console
- Ensure proper MIME types on server
- Verify CORS settings for cross-origin

**Themes not working?**  
- Check that CSS files are in `dist/css/`
- Verify theme paths in HTML
- Test with `./test-wasm.sh`

**Build failing?**
- Ensure `wasm-pack` is installed
- Check Rust toolchain is up to date
- Verify `papers/` directory exists

## 📄 License

Same as the original Open Pages project.

---

**🎉 Welcome to the future of static documentation!**

This WASM approach represents a paradigm shift from traditional server-side generation to client-side processing, offering unprecedented flexibility and deployment simplicity while maintaining the exact user experience you've come to love.