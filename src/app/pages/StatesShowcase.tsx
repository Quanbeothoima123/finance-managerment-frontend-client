import React, { useState } from "react";
import {
  EmptyStateHome,
  EmptyStateTransactions,
  EmptyStateTransactionsFiltered,
  EmptyStateBudgets,
  EmptyStateGoals,
  EmptyStateAccounts,
  EmptyStateCategories,
  EmptyStateTags,
  EmptyStateMerchants,
  EmptyStateAttachments,
  EmptyStateSearch,
} from "../components/EmptyStates";
import {
  ErrorStateDatabase,
  ErrorStatePermission,
  ErrorStateUnexpected,
  ErrorStateNetwork,
  ErrorStateNotFound,
  ErrorModal,
  InlineError,
  BannerError,
} from "../components/ErrorStates";
import {
  DeleteTransactionModal,
  DeleteAccountModal,
  DeleteBudgetModal,
  DeleteGoalModal,
  DeleteCategoryModal,
  LogoutModal,
  DiscardChangesModal,
} from "../components/ConfirmationModals";
import {
  SuccessToast,
  ErrorToast,
  InfoToast,
  WarningToast,
  DeletedTransactionToast,
  ToastProvider,
  useToast,
} from "../components/Toast";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

function ToastDemoSection() {
  const toast = useToast();

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Interactive Toast Demos
      </h3>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => toast.showSuccessToast("Đã lưu giao dịch")}>
          Success Toast
        </Button>

        <Button onClick={() => toast.showErrorToast("Không thể lưu")}>
          Error Toast with Retry
        </Button>

        <Button onClick={() => toast.showInfoToast("Đã áp dụng bộ lọc")}>
          Info Toast
        </Button>

        <Button onClick={() => toast.showWarningToast("Ngân sách sắp hết")}>
          Warning Toast
        </Button>

        <Button onClick={() => toast.showSuccessToast("Đã xoá giao dịch")}>
          Toast with Undo
        </Button>
      </div>
    </div>
  );
}

function StatesShowcaseContent() {
  // Modal states
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] =
    useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeleteBudgetModal, setShowDeleteBudgetModal] = useState(false);
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalType, setErrorModalType] = useState<
    "database" | "permission" | "unexpected" | "network"
  >("unexpected");
  const [showBannerError, setShowBannerError] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            States (J1-J4) - Design Showcase
          </h1>
          <p className="text-gray-600">
            Complete UI states including empty states, error states,
            confirmation modals, and toast notifications
          </p>
        </div>

        {/* J1 - Empty States */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            J1 - Empty States
          </h2>

          {/* Light Theme Examples */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Light Theme
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Home Dashboard (No Data)
                </h4>
                <EmptyStateHome />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Transactions List (Empty)
                </h4>
                <EmptyStateTransactions />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Transactions (Filtered - No Results)
                </h4>
                <EmptyStateTransactionsFiltered />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Budgets (Empty)
                </h4>
                <EmptyStateBudgets />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Goals (Empty)
                </h4>
                <EmptyStateGoals />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Accounts (Empty)
                </h4>
                <EmptyStateAccounts />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Categories (Empty)
                </h4>
                <EmptyStateCategories />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Tags (Empty)
                </h4>
                <EmptyStateTags />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Merchants (Empty)
                </h4>
                <EmptyStateMerchants />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Attachments (Empty)
                </h4>
                <EmptyStateAttachments />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Search Results (Empty)
                </h4>
                <EmptyStateSearch />
              </Card>
            </div>
          </div>

          {/* Dark Theme Examples */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Dark Theme
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="dark bg-[#0f1113] p-6 rounded-lg">
                <h4 className="font-semibold text-white mb-4">
                  Home Dashboard
                </h4>
                <EmptyStateHome />
              </div>

              <div className="dark bg-[#0f1113] p-6 rounded-lg">
                <h4 className="font-semibold text-white mb-4">Transactions</h4>
                <EmptyStateTransactions />
              </div>

              <div className="dark bg-[#0f1113] p-6 rounded-lg">
                <h4 className="font-semibold text-white mb-4">Budgets</h4>
                <EmptyStateBudgets />
              </div>

              <div className="dark bg-[#0f1113] p-6 rounded-lg">
                <h4 className="font-semibold text-white mb-4">Goals</h4>
                <EmptyStateGoals />
              </div>
            </div>
          </div>
        </section>

        {/* J2 - Error States */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            J2 - Error States
          </h2>

          {/* Full Page Error States - Light */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Full Page Errors - Light Theme
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Database Error
                </h4>
                <ErrorStateDatabase />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Permission Denied
                </h4>
                <ErrorStatePermission />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Unexpected Error
                </h4>
                <ErrorStateUnexpected />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  Network Error
                </h4>
                <ErrorStateNetwork />
              </Card>

              <Card className="bg-white">
                <h4 className="font-semibold text-gray-700 mb-4">
                  404 Not Found
                </h4>
                <ErrorStateNotFound />
              </Card>
            </div>
          </div>

          {/* Full Page Error States - Dark */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Full Page Errors - Dark Theme
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="dark bg-[#0f1113] p-6 rounded-lg">
                <h4 className="font-semibold text-white mb-4">
                  Database Error
                </h4>
                <ErrorStateDatabase />
              </div>

              <div className="dark bg-[#0f1113] p-6 rounded-lg">
                <h4 className="font-semibold text-white mb-4">Network Error</h4>
                <ErrorStateNetwork />
              </div>
            </div>
          </div>

          {/* Inline & Banner Errors */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Inline & Banner Errors
            </h3>

            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-700">Light Theme</h4>
              <InlineError
                message="Không thể lưu thay đổi. Vui lòng kiểm tra kết nối và thử lại."
                onRetry={() => console.log("Retry")}
              />
            </div>

            <div className="dark bg-[#0f1113] p-6 rounded-lg space-y-4">
              <h4 className="font-semibold text-white">Dark Theme</h4>
              <InlineError
                message="Không thể lưu thay đổi. Vui lòng kiểm tra kết nối và thử lại."
                onRetry={() => console.log("Retry")}
              />
            </div>

            <div className="mt-6 space-y-4">
              <h4 className="font-semibold text-gray-700">Banner Errors</h4>
              {showBannerError && (
                <BannerError
                  message="Mất kết nối đến máy chủ. Một số tính năng có thể không khả dụng."
                  onDismiss={() => setShowBannerError(false)}
                  onAction={{
                    label: "Thử lại",
                    onClick: () => console.log("Retry"),
                  }}
                />
              )}
              {!showBannerError && (
                <Button onClick={() => setShowBannerError(true)}>
                  Show Banner Error
                </Button>
              )}
            </div>
          </div>

          {/* Error Modals */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Error Modals
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setErrorModalType("database");
                  setShowErrorModal(true);
                }}
              >
                Database Error Modal
              </Button>
              <Button
                onClick={() => {
                  setErrorModalType("permission");
                  setShowErrorModal(true);
                }}
              >
                Permission Error Modal
              </Button>
              <Button
                onClick={() => {
                  setErrorModalType("unexpected");
                  setShowErrorModal(true);
                }}
              >
                Unexpected Error Modal
              </Button>
              <Button
                onClick={() => {
                  setErrorModalType("network");
                  setShowErrorModal(true);
                }}
              >
                Network Error Modal
              </Button>
            </div>
          </div>
        </section>

        {/* J3 - Confirmation Modals */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            J3 - Confirmation Modals
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Modal Triggers
            </h3>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setShowDeleteTransactionModal(true)}>
                Delete Transaction
              </Button>
              <Button onClick={() => setShowDeleteAccountModal(true)}>
                Delete Account (with checkbox)
              </Button>
              <Button onClick={() => setShowDeleteBudgetModal(true)}>
                Delete Budget
              </Button>
              <Button onClick={() => setShowDeleteGoalModal(true)}>
                Delete Goal
              </Button>
              <Button onClick={() => setShowDeleteCategoryModal(true)}>
                Delete Category (50+ transactions)
              </Button>
              <Button onClick={() => setShowLogoutModal(true)}>Logout</Button>
              <Button onClick={() => setShowDiscardModal(true)}>
                Discard Changes
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Click buttons above to see confirmation
                modals. Each modal includes:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside mt-2 space-y-1">
                <li>Clear warning icon and title</li>
                <li>Descriptive message</li>
                <li>Optional consequences list (for dangerous actions)</li>
                <li>Optional checkbox "Tôi hiểu" for critical actions</li>
                <li>Danger-styled confirm button</li>
                <li>Cancel button</li>
              </ul>
            </div>
          </div>
        </section>

        {/* J4 - Success Toasts/Snackbars */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            J4 - Success Toasts/Snackbars
          </h2>

          {/* Static Toast Examples - Light */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Static Toast Examples - Light Theme
            </h3>
            <div className="space-y-4">
              <SuccessToast message="Đã lưu giao dịch" />
              <ErrorToast
                message="Không thể lưu"
                onRetry={() => console.log("Retry")}
              />
              <InfoToast message="Đã áp dụng bộ lọc" />
              <WarningToast message="Ngân sách sắp hết" />
              <DeletedTransactionToast onUndo={() => console.log("Undo")} />
            </div>
          </div>

          {/* Static Toast Examples - Dark */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Static Toast Examples - Dark Theme
            </h3>
            <div className="dark bg-[#0f1113] p-6 rounded-lg space-y-4">
              <SuccessToast message="Đã lưu giao dịch" />
              <ErrorToast
                message="Không thể lưu"
                onRetry={() => console.log("Retry")}
              />
              <InfoToast message="Đã áp dụng bộ lọc" />
              <WarningToast message="Ngân sách sắp hết" />
              <DeletedTransactionToast onUndo={() => console.log("Undo")} />
            </div>
          </div>

          {/* Interactive Toasts */}
          <div>
            <ToastDemoSection />
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Click buttons above to trigger real toast
                notifications in the bottom-right corner. Toasts will
                auto-dismiss after 5 seconds and include smooth animations.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Feature Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">
                Empty States (J1)
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ 11 specialized empty states</li>
                <li>✅ Contextual illustrations</li>
                <li>✅ Clear messaging</li>
                <li>✅ Primary & secondary CTAs</li>
                <li>✅ Fully responsive</li>
                <li>✅ Light & Dark theme support</li>
              </ul>
            </Card>

            <Card className="bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">
                Error States (J2)
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ 5 full-page error types</li>
                <li>✅ Error modals</li>
                <li>✅ Inline errors</li>
                <li>✅ Banner errors</li>
                <li>✅ Error codes display</li>
                <li>✅ Retry & support actions</li>
              </ul>
            </Card>

            <Card className="bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">
                Confirmation Modals (J3)
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ 7 specialized modals</li>
                <li>✅ Warning indicators</li>
                <li>✅ Consequences list</li>
                <li>✅ Optional "Tôi hiểu" checkbox</li>
                <li>✅ Danger-styled confirm button</li>
                <li>✅ Backdrop click to close</li>
              </ul>
            </Card>

            <Card className="bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">
                Toasts/Snackbars (J4)
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ 4 toast types (success/error/info/warning)</li>
                <li>✅ Context provider & hooks</li>
                <li>✅ Optional actions (Undo, Retry)</li>
                <li>✅ Auto-dismiss (configurable)</li>
                <li>✅ Smooth animations</li>
                <li>✅ Stack multiple toasts</li>
              </ul>
            </Card>
          </div>
        </section>
      </div>

      {/* Modals */}
      <DeleteTransactionModal
        isOpen={showDeleteTransactionModal}
        onClose={() => setShowDeleteTransactionModal(false)}
        onConfirm={() => {
          console.log("Transaction deleted");
          setShowDeleteTransactionModal(false);
        }}
        transactionDescription="Cơm trưa - Quán Ngon"
        transactionAmount="450,000₫"
      />

      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={() => {
          console.log("Account deleted");
          setShowDeleteAccountModal(false);
        }}
        accountName="Techcombank"
        accountBalance="45,700,000₫"
        transactionCount={247}
      />

      <DeleteBudgetModal
        isOpen={showDeleteBudgetModal}
        onClose={() => setShowDeleteBudgetModal(false)}
        onConfirm={() => {
          console.log("Budget deleted");
          setShowDeleteBudgetModal(false);
        }}
        budgetName="Ngân sách tháng 2"
      />

      <DeleteGoalModal
        isOpen={showDeleteGoalModal}
        onClose={() => setShowDeleteGoalModal(false)}
        onConfirm={() => {
          console.log("Goal deleted");
          setShowDeleteGoalModal(false);
        }}
        goalName="Mua MacBook Pro"
        goalProgress="65%"
      />

      <DeleteCategoryModal
        isOpen={showDeleteCategoryModal}
        onClose={() => setShowDeleteCategoryModal(false)}
        onConfirm={() => {
          console.log("Category deleted");
          setShowDeleteCategoryModal(false);
        }}
        categoryName="Ăn uống"
        transactionCount={127}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          console.log("Logged out");
          setShowLogoutModal(false);
        }}
      />

      <DiscardChangesModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={() => {
          console.log("Changes discarded");
          setShowDiscardModal(false);
        }}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type={errorModalType}
      />
    </div>
  );
}

export default function StatesShowcase() {
  return (
    <ToastProvider>
      <StatesShowcaseContent />
    </ToastProvider>
  );
}
