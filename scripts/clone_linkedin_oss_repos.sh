#!/usr/bin/env bash
# Clone all LinkedIn OSS repos referenced in docs/research/linkedin-oss-data-access-map.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${ROOT}/docs/research/repos"
mkdir -p "${DEST}"

clone_repo() {
  local github="$1"
  local local_dir="$2"
  local target="${DEST}/${local_dir}"

  if [[ -d "${target}/.git" ]]; then
    echo "Updating ${local_dir}..."
    git -C "${target}" pull --ff-only
    return
  fi

  if [[ -d "${target}" ]]; then
    echo "Skipping ${local_dir}: exists but is not a git repo"
    return
  fi

  echo "Cloning ${github} -> ${local_dir}..."
  git clone --depth 1 "https://github.com/${github}.git" "${target}"
}

clone_repo "stickerdaniel/linkedin-mcp-server" "linkedin-mcp-server"
clone_repo "Michaelrecycle/linkedin-mcp" "linkedin-mcp"
clone_repo "joeyism/linkedin_scraper" "linkedin_scraper"
clone_repo "nsandman/linkedin-api" "linkedin-api"
clone_repo "joshiayush/inb" "inb"
clone_repo "josephlimtech/linkedin-profile-scraper-api" "linkedin-profile-scraper-api"
clone_repo "linvo-io/linvo-scraper" "linvo-scraper"
clone_repo "l4rm4nd/LinkedInDumper" "LinkedInDumper"
clone_repo "codyrobertson/linkedin-cli" "codyrobertson-linkedin-cli"
clone_repo "eracle/linkedin-cli" "eracle-linkedin-cli"
clone_repo "eracle/OpenOutreach" "OpenOutreach"
clone_repo "trieb-work/linkedin-voyager-sdk" "linkedin-voyager-sdk"
clone_repo "ArthurVerrez/linkedin-scraping-tools" "linkedin-scraping-tools"
clone_repo "padmanabhan-s/scraping-linkedin-salesNavigator" "scraping-linkedin-salesNavigator"

echo "Done. Repos in ${DEST}"
