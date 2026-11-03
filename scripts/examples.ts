// Renders a card for each RINCI site and variant into examples/, to check the layout by eye.
import { mkdir, writeFile } from "node:fs/promises"
import { type CardProps, renderCard } from "../src/index"

const cards: Record<string, CardProps> = {
  secrets: { title: "Every secrets manager,", subtitle: "one command.", chip: "rinci-secrets run -- bun dev" },
  "secrets-repo": {
    title: "Every secrets manager,",
    subtitle: "one command.",
    chip: "rinci-secrets run -- bun dev",
    repo: "rinci-labs/secrets",
    license: "MIT",
  },
  "secrets-stats": {
    title: "Every secrets manager,",
    subtitle: "one command.",
    stats: [
      { value: "11", label: "providers" },
      { value: "0", label: "dependencies" },
    ],
    repo: "rinci-labs/secrets",
    license: "MIT",
  },
  docs: {
    title: "AWS Secrets Manager",
    subtitle: "Read secrets from AWS Secrets Manager with SigV4 signing and no SDK.",
    chip: "secrets.rin.ci/docs/aws",
    label: "Docs · Providers",
  },
  link: { title: "Short links, custom domains,", subtitle: "and click analytics.", chip: "rin.ci/your-slug" },
  hub: { title: "Transactional email,", subtitle: "sent and monitored.", chip: "in.rin.ci" },
  og: {
    title: "One card",
    subtitle: "for every RINCI site.",
    chip: "rinci-og --title …",
    repo: "rinci-labs/og",
    license: "MIT",
  },
  mark: { variant: "mark", tagline: "We build apps and websites.", url: "rin.ci" },
  "mark-matrix": { variant: "mark", background: "matrix", tagline: "We build apps and websites.", url: "rin.ci" },
  "link-dots": {
    background: "dots",
    title: "Short links, custom domains,",
    subtitle: "and click analytics.",
    chip: "rin.ci/your-slug",
  },
  "secrets-matrix": {
    background: "matrix",
    title: "Every secrets manager,",
    subtitle: "one command.",
    chip: "rinci-secrets run -- bun dev",
    repo: "rinci-labs/secrets",
    license: "MIT",
  },
  "secrets-mountains": {
    background: "mountains",
    title: "Every secrets manager,",
    subtitle: "one command.",
    chip: "rinci-secrets run -- bun dev",
    repo: "rinci-labs/secrets",
    license: "MIT",
  },
  "link-waves": {
    background: "waves",
    title: "Short links, custom domains,",
    subtitle: "and click analytics.",
    chip: "rin.ci/your-slug",
  },
  "hub-city": { background: "city", title: "Transactional email,", subtitle: "sent and monitored.", chip: "in.rin.ci" },
  "mark-mountains": { variant: "mark", background: "mountains", tagline: "We build apps and websites.", url: "rin.ci" },
  "hub-plain": {
    background: "plain",
    title: "Transactional email,",
    subtitle: "sent and monitored.",
    chip: "in.rin.ci",
  },
}

await mkdir("examples", { recursive: true })
for (const [name, props] of Object.entries(cards)) {
  await writeFile(`examples/${name}.png`, await renderCard(props))
  console.log(`examples/${name}.png`)
}
