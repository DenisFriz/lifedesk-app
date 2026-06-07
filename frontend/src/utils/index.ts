export function createPageUrl(pageName?: string) {
  if (!pageName) return '/'
  const kebab = pageName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/ /g, '-')
    .toLowerCase()
  return '/' + kebab
}
