import { execSync } from 'child_process'

export function mochaGlobalSetup() {
  execSync('scripts/test/prepare.sh')
}

export function mochaGlobalTeardown() {
  execSync('scripts/test/clean.sh')
}
