#!/usr/bin/env bash
set -Eeuo pipefail

workspace_dir="${1:-$PWD}"
devcontainer_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

setup_ssh_config() {
  local ssh_auth_sock="/tmp/ssh-agent.sock"
  local onepassword_include=""
  local onepassword_mount="/tmp/host-ssh/1Password"

  install -d -m 700 "$HOME/.ssh"
  rm -rf "$HOME/.ssh/1Password"

  if [ -d "$onepassword_mount" ]; then
    ln -sfn "$onepassword_mount" "$HOME/.ssh/1Password"
    onepassword_include="Include ~/.ssh/1Password/config"
  fi

  if [ -f /tmp/host-ssh/known_hosts ]; then
    cp /tmp/host-ssh/known_hosts "$HOME/.ssh/known_hosts"
  fi

  sed \
    -e "s|__SSH_INCLUDE_1PASSWORD__|$onepassword_include|g" \
    -e "s|__SSH_AUTH_SOCK__|$ssh_auth_sock|g" \
    "$devcontainer_dir/templates/.sshconfig" >"$HOME/.ssh/config"

  chmod 600 "$HOME/.ssh/config"
}

setup_git_config() {
  local gitconfig_template
  local ssh_keygen_bin

  gitconfig_template="$devcontainer_dir/templates/.gitconfig"
  ssh_keygen_bin="$(command -v ssh-keygen)"

  sed \
    -e "s|__SSH_KEYGEN__|$ssh_keygen_bin|g" \
    "$gitconfig_template" >"$HOME/.gitconfig"

  mkdir -p "$HOME/.config/git"
  git config --file "$HOME/.config/git/config" --replace-all safe.directory "$workspace_dir"
}

run_step() {
  local label="$1"
  local log_file
  shift

  log_file="$(mktemp)"
  printf '%s\n' "$label"

  if "$@" >"$log_file" 2>&1; then
    rm -f "$log_file"
    return 0
  fi

  cat "$log_file" >&2
  rm -f "$log_file"
  return 1
}

on_create() {
  run_step "Setting up SSH config" setup_ssh_config
  run_step "Setting up git config" setup_git_config
}

on_create
