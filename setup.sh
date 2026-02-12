#!/bin/bash
set -e

echo "=== Video Pipeline Setup ==="
echo ""

# Check we're on macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "Error: This script is for macOS only"
  exit 1
fi

# Install Homebrew if missing
if ! command -v brew &> /dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
else
  echo "Homebrew already installed"
fi

# Install system dependencies
echo ""
echo "=== Installing system dependencies ==="
brew install ffmpeg node python3 git

# Install whisper.cpp (local transcription on Apple Silicon)
echo ""
echo "=== Installing whisper.cpp ==="
if [ ! -d "$HOME/whisper.cpp" ]; then
  cd "$HOME"
  git clone https://github.com/ggerganov/whisper.cpp.git
  cd whisper.cpp
  make clean
  WHISPER_COREML=1 make -j
  bash models/download-ggml-model.sh large-v3
  echo "whisper.cpp installed at ~/whisper.cpp"
else
  echo "whisper.cpp already installed"
fi

# Go back to project dir
cd "$(dirname "$0")"

# Install Node dependencies
echo ""
echo "=== Installing Node.js dependencies ==="
npm install

# Install Remotion dependencies
echo ""
echo "=== Installing Remotion subtitle renderer ==="
cd remotion && npm install && cd ..

# Create required directories
mkdir -p credentials

# Copy env template if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "Created .env file - fill in your API keys:"
  echo "  nano .env"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Place Google service account key at ./credentials/google-service-account.json"
echo "  3. Run: npm run pipeline"
