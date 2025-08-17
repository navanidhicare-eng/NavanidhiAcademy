import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MathJaxComponent from '@/components/ui/MathJax';

export default function MathPreview() {
  const [latexInput, setLatexInput] = useState(`
Welcome to LaTeX Math Preview!

Here are some examples of mathematical notation:

**Inline Math:**
The famous equation $E = mc^2$ shows the mass-energy equivalence.
We can also write simple expressions like $x^2 + y^2 = z^2$.

**Block Math:**
$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

**Fractions and Complex Expressions:**
$$f(x) = \\frac{a_0 + a_1 x + a_2 x^2 + \\cdots + a_n x^n}{b_0 + b_1 x + b_2 x^2 + \\cdots + b_m x^m}$$

**Matrix Example:**
$$\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}$$

**Summation and Products:**
$$\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}$$

Try editing the LaTeX code below to see real-time rendering!
  `.trim());

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-800 mb-6">
        LaTeX Math Preview - Navanidhi Academy
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">LaTeX Input</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use $...$ for inline math and $$...$$ for block math
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Enter your LaTeX content here..."
            />
            
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
              <strong>Quick Reference:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Inline: $x^2$ or $\\frac{a}{b}$</li>
                <li>• Block: $$E = mc^2$$</li>
                <li>• Fractions: $\\frac{numerator}{denominator}$</li>
                <li>• Powers: $x^{power}$, Subscripts: $x_{subscript}$</li>
                <li>• Greek: $\\alpha, \\beta, \\gamma, \\pi, \\sigma$</li>
                <li>• Integrals: $\\int_a^b f(x)dx$</li>
                <li>• Sums: $\\sum_{i=1}^n i$</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Rendered Output</CardTitle>
            <p className="text-sm text-muted-foreground">
              Live preview of your LaTeX content
            </p>
          </CardHeader>
          <CardContent>
            <div className="min-h-[400px] p-4 bg-white border rounded-md overflow-auto">
              <MathJaxComponent>{latexInput}</MathJaxComponent>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">Usage in Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This LaTeX support is now available in the Topics feature. When creating or editing topics, 
            you can use the description field to include mathematical formulas that will be rendered 
            beautifully for students and teachers.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded">
              <h4 className="font-medium text-green-800 mb-2">Example Topic: Quadratic Formula</h4>
              <div className="text-sm">
                <MathJaxComponent>
                  {`The quadratic formula is used to solve equations of the form $ax^2 + bx + c = 0$.

The solution is given by:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Where:
- $a$, $b$, and $c$ are coefficients
- $\\Delta = b^2 - 4ac$ is the discriminant`}
                </MathJaxComponent>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}