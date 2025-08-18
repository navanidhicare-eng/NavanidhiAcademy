
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Users, CreditCard, AlertTriangle, Scale, Shield } from 'lucide-react';
import { useLocation } from 'wouter';

export function TermsOfUse() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <img src="/navanidhi-logo.png" alt="Navanidhi Academy" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-lg font-semibold text-blue-800">Navanidhi Academy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="shadow-lg border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <FileText className="h-6 w-6" />
              Terms of Use
            </CardTitle>
            <p className="text-blue-100 text-sm">
              Last updated: January 2025 | Effective Date: January 1, 2025
            </p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Introduction */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Agreement to Terms</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                By accessing and using Navanidhi Academy's educational platform and services, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree with any of these terms, you should not use our services.
              </p>
            </div>

            {/* Service Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Service Description</h2>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Navanidhi Academy provides online educational services including but not limited to learning modules, 
                  progress tracking, assessments, and educational content management through SO Centers and direct student access.
                </p>
              </div>
            </div>

            {/* User Accounts */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">User Accounts</h2>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You must provide accurate and complete information when creating an account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You are responsible for maintaining the confidentiality of your account credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You must notify us immediately of any unauthorized use of your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>One account per user; sharing accounts is prohibited</span>
                </li>
              </ul>
            </div>

            {/* Payment Terms */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Payment and Billing</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Fee Structure</h3>
                  <ul className="text-gray-600 space-y-1 text-sm list-disc list-inside">
                    <li>Monthly and yearly course fees as displayed on the platform</li>
                    <li>Admission fees where applicable</li>
                    <li>Additional charges for premium features or services</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2">Payment Terms</h3>
                  <ul className="text-gray-600 space-y-1 text-sm list-disc list-inside">
                    <li>Payments are due as per the selected billing cycle</li>
                    <li>Late payments may result in service suspension</li>
                    <li>Refunds are subject to our refund policy</li>
                    <li>Price changes will be communicated in advance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Acceptable Use */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Acceptable Use Policy</h2>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">Prohibited Activities</h3>
                <ul className="text-gray-600 space-y-1 text-sm list-disc list-inside">
                  <li>Sharing account credentials or accessing others' accounts</li>
                  <li>Attempting to hack, disrupt, or damage our systems</li>
                  <li>Using the platform for any illegal or unauthorized purpose</li>
                  <li>Uploading malicious content or spam</li>
                  <li>Violating intellectual property rights</li>
                  <li>Harassing or abusing other users or staff</li>
                </ul>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Intellectual Property</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm leading-relaxed">
                  All content, materials, and intellectual property on our platform are owned by Navanidhi Academy or our licensors. 
                  You may not copy, distribute, or create derivative works from our content without explicit written permission.
                </p>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Disclaimers and Limitations</h2>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <ul className="text-gray-600 space-y-1 text-sm list-disc list-inside">
                  <li>Services are provided "as is" without warranties of any kind</li>
                  <li>We do not guarantee specific educational outcomes</li>
                  <li>Our liability is limited to the amount paid for services</li>
                  <li>We are not responsible for third-party content or services</li>
                </ul>
              </div>
            </div>

            {/* Termination */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Termination</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Either party may terminate this agreement at any time. We reserve the right to suspend or terminate accounts 
                that violate these terms. Upon termination, your access to the platform will cease, though certain provisions 
                of these terms will survive termination.
              </p>
            </div>

            {/* Governing Law */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Governing Law</h2>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm leading-relaxed">
                  These terms are governed by the laws of India. Any disputes shall be resolved through arbitration 
                  or in the courts having jurisdiction over Navanidhi Academy's principal place of business.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800">Contact Us</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm leading-relaxed">
                  If you have any questions about these Terms of Use, please contact us at:
                </p>
                <div className="mt-3 text-sm text-blue-700">
                  <p><strong>Email:</strong> legal@navanidhi-academy.com</p>
                  <p><strong>Address:</strong> Navanidhi Academy Legal Department</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
