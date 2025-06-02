
export default function(code: string): string {
    return 'export default `' + code.replaceAll('`', '\\`') + '`;';
}
