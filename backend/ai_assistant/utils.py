"""
Role-specific system prompts and live data snapshots for the AI Assistant.
The AI receives real-time data from the database so it can give actual
analytics answers, not just generic guidance.

Data is fetched fresh on EVERY message — so the AI always sees the latest state.
Admin gets a full org-wide snapshot (all franchises, all users) so they can
drill down into any franchise or user. Non-admin roles see only their own data.
"""
from datetime import date, timedelta
from django.db.models import Sum


def get_live_data(role, profile):
    """Fetch a live data snapshot tailored to the user's role."""
    if role == 'admin':
        return _admin_snapshot(profile)
    elif role == 'franchise_owner':
        return _franchise_snapshot(profile)
    elif role == 'store_manager':
        return _store_manager_snapshot(profile)
    else:
        return _user_snapshot(profile)


# ════════════════════════════════════════════════════════════════
# Admin — sees everything: all franchises, all users, full org
# ════════════════════════════════════════════════════════════════

def _admin_snapshot(profile):
    from franchises.models import Franchise
    from sales.models import Sale
    from products.models import Product
    from approvals.models import Approval
    from compliance.models import FranchiseCompliance
    from inventory.models import Inventory
    from expenses.models import Expense
    from accounts.models import UserProfile
    from django.contrib.auth.models import User

    today = date.today()
    month_start = today.replace(day=1)

    # ── Org-wide aggregates ──
    total_franchises = Franchise.objects.count()
    active_franchises = Franchise.objects.filter(status='active').count()
    total_sales = Sale.objects.count()
    revenue = Sale.objects.filter(status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    today_sales = Sale.objects.filter(sale_date__date=today).count()
    today_revenue = Sale.objects.filter(sale_date__date=today, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    month_revenue = Sale.objects.filter(sale_date__date__gte=month_start, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    total_products = Product.objects.filter(is_active=True).count()
    pending_approvals = Approval.objects.filter(status='pending').count()
    non_compliant = FranchiseCompliance.objects.filter(status='non_compliant').count()
    low_stock_count = Inventory.objects.filter(quantity__lte=5).count()
    month_expenses = Expense.objects.filter(created_at__date__gte=month_start).aggregate(s=Sum('amount'))['s'] or 0

    # ── Per-franchise breakdown ──
    all_franchises = Franchise.objects.all()
    franchise_rows = []
    for f in all_franchises:
        f_sales = Sale.objects.filter(franchise=f).count()
        f_rev = Sale.objects.filter(franchise=f, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
        f_month_rev = Sale.objects.filter(franchise=f, sale_date__date__gte=month_start, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
        f_exp = Expense.objects.filter(franchise=f, created_at__date__gte=month_start).aggregate(s=Sum('amount'))['s'] or 0
        f_approvals = Approval.objects.filter(requested_by__profile__franchises=f, status='pending').count()
        f_compliance = FranchiseCompliance.objects.filter(franchise=f)
        f_comp_ok = f_compliance.filter(status='compliant').count()
        f_comp_bad = f_compliance.filter(status='non_compliant').count()
        f_low = Inventory.objects.filter(franchise=f, quantity__lte=5).count()
        franchise_rows.append(
            f"  • {f.name} ({f.status}): {f_sales} sales, ₹{int(f_rev):,} total rev, "
            f"₹{int(f_month_rev):,} this month, ₹{int(f_exp):,} expenses, "
            f"{f_approvals} pending approvals, {f_comp_ok}/{f_comp_ok+f_comp_bad} compliant, "
            f"{f_low} low-stock items"
        )

    # ── User directory ──
    profiles = UserProfile.objects.select_related('user').prefetch_related('franchises').all()
    user_rows = []
    for p in profiles:
        fn = ', '.join(f.name for f in p.franchises.all()) or 'Unassigned'
        user_rows.append(f"  • {p.user.username} — role: {p.role}, franchise: {fn}")

    return (
        f"\n\n=== LIVE ORG-WIDE DATA (Admin View) ===\n"
        f"Refreshed: {today}\n\n"
        f"SUMMARY:\n"
        f"  Franchises: {total_franchises} total, {active_franchises} active\n"
        f"  Total Sales: {total_sales} recorded | Total Revenue: ₹{int(revenue):,}\n"
        f"  Today: {today_sales} sales, ₹{int(today_revenue):,} revenue\n"
        f"  This Month: ₹{int(month_revenue):,} revenue | ₹{int(month_expenses):,} expenses\n"
        f"  Products: {total_products} active\n"
        f"  Pending Approvals: {pending_approvals}\n"
        f"  Non-Compliant Records: {non_compliant}\n"
        f"  Low Stock Items (≤5): {low_stock_count}\n\n"
        f"PER-FRANCHISE BREAKDOWN:\n"
        + '\n'.join(franchise_rows) + '\n\n'
        f"USER DIRECTORY:\n"
        + '\n'.join(user_rows) + '\n\n'
        f"You have full org data for every franchise and every user above. "
        f"When the admin asks about a specific franchise (by name) or user (by username), "
        f"look it up in the breakdowns above and give precise answers. "
        f"You can compare franchises, identify top/bottom performers, "
        f"flag compliance issues per franchise, and discuss any user's role or assignment. "
        f"Data refreshes on every message so it's always current."
    )


# ════════════════════════════════════════════════════════════════
# Franchise Owner — sees ONLY their own franchise in detail
# ════════════════════════════════════════════════════════════════

def _franchise_snapshot(profile):
    from sales.models import Sale
    from approvals.models import Approval
    from compliance.models import FranchiseCompliance
    from inventory.models import Inventory
    from expenses.models import Expense

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    user_franchises = list(profile.franchises.all())

    if not user_franchises:
        return "\n\n=== NOTE ===\nThis user has no franchise assigned yet. Encourage them to contact an admin."

    franchise_names = ', '.join(f.name for f in user_franchises)
    total_sales = Sale.objects.filter(franchise__in=user_franchises).count()
    revenue = Sale.objects.filter(franchise__in=user_franchises, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    today_sales = Sale.objects.filter(franchise__in=user_franchises, sale_date__date=today).count()
    today_revenue = Sale.objects.filter(franchise__in=user_franchises, sale_date__date=today, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    week_revenue = Sale.objects.filter(franchise__in=user_franchises, sale_date__date__gte=week_start, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    month_revenue = Sale.objects.filter(franchise__in=user_franchises, sale_date__date__gte=month_start, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    month_expenses = Expense.objects.filter(franchise__in=user_franchises, created_at__date__gte=month_start).aggregate(s=Sum('amount'))['s'] or 0

    pending_approvals = Approval.objects.filter(requested_by__profile__franchises__in=user_franchises, status='pending').count()
    total_compliance = FranchiseCompliance.objects.filter(franchise__in=user_franchises).count()
    compliant = FranchiseCompliance.objects.filter(franchise__in=user_franchises, status='compliant').count()
    non_compliant = FranchiseCompliance.objects.filter(franchise__in=user_franchises, status='non_compliant').count()

    low_stock_items = list(
        Inventory.objects.filter(franchise__in=user_franchises, quantity__lte=5)
        .values_list('product__name', 'quantity')[:10]
    )
    low_stock_str = ', '.join(f'{name} ({qty} left)' for name, qty in low_stock_items) or 'None'

    # Recent sales
    recent = list(
        Sale.objects.filter(franchise__in=user_franchises).order_by('-sale_date')[:5]
        .values_list('id', 'total_amount', 'status', 'sale_date')
    )
    recent_str = ', '.join(f'#{id} ₹{int(amt):,} ({status})' for id, amt, status, _ in recent) or 'None'

    return (
        f"\n\n=== LIVE DATA — {franchise_names} ===\n"
        f"Refreshed: {today}\n\n"
        f"FRANCHISE(S): {franchise_names}\n"
        f"  Total Sales: {total_sales} recorded | Total Revenue: ₹{int(revenue):,}\n"
        f"  Today: {today_sales} sales, ₹{int(today_revenue):,} revenue\n"
        f"  This Week: ₹{int(week_revenue):,} | This Month: ₹{int(month_revenue):,}\n"
        f"  Monthly Expenses: ₹{int(month_expenses):,}\n"
        f"  Profit/Loss This Month: ₹{int(month_revenue - month_expenses):,}\n"
        f"  Pending Approvals: {pending_approvals}\n"
        f"  Compliance: {compliant}/{total_compliance} complete, {non_compliant} non-compliant\n"
        f"  Low Stock: {low_stock_str}\n"
        f"  Recent Sales: {recent_str}\n\n"
        f"This is YOUR franchise data only. You cannot see other franchises' numbers. "
        f"If the owner asks about things outside their franchise, explain that "
        f"you can only see {franchise_names}'s data — suggest they contact corporate admin "
        f"for org-wide comparisons. "
        f"Highlight concerns: low stock, non-compliance, high expenses vs revenue. "
        f"Data refreshes on every message."
    )


# ════════════════════════════════════════════════════════════════
# Store Manager — same franchise data, more operational focus
# ════════════════════════════════════════════════════════════════

def _store_manager_snapshot(profile):
    from sales.models import Sale
    from approvals.models import Approval
    from compliance.models import FranchiseCompliance
    from inventory.models import Inventory
    from expenses.models import Expense

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    user_franchises = list(profile.franchises.all())

    if not user_franchises:
        return "\n\n=== NOTE ===\nThis user has no franchise assigned yet. Suggest they contact their admin."

    franchise_names = ', '.join(f.name for f in user_franchises)
    today_sales = Sale.objects.filter(franchise__in=user_franchises, sale_date__date=today).count()
    today_revenue = Sale.objects.filter(franchise__in=user_franchises, sale_date__date=today, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    week_revenue = Sale.objects.filter(franchise__in=user_franchises, sale_date__date__gte=week_start, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
    week_expenses = Expense.objects.filter(franchise__in=user_franchises, created_at__date__gte=week_start).aggregate(s=Sum('amount'))['s'] or 0

    pending_approvals = Approval.objects.filter(requested_by__profile__franchises__in=user_franchises, status='pending').count()
    in_review = FranchiseCompliance.objects.filter(franchise__in=user_franchises, status='in_review').count()
    non_compliant = FranchiseCompliance.objects.filter(franchise__in=user_franchises, status='non_compliant').count()

    low_stock = list(
        Inventory.objects.filter(franchise__in=user_franchises, quantity__lte=5)
        .values_list('product__name', 'quantity')[:10]
    )
    low_stock_str = ', '.join(f'{name} ({qty})' for name, qty in low_stock) or 'None'

    return (
        f"\n\n=== LIVE DATA — {franchise_names} ===\n"
        f"Refreshed: {today}\n\n"
        f"STORE(S): {franchise_names}\n"
        f"  Today: {today_sales} sales, ₹{int(today_revenue):,} revenue\n"
        f"  This Week: ₹{int(week_revenue):,} revenue | ₹{int(week_expenses):,} expenses\n"
        f"  Pending Approvals: {pending_approvals}\n"
        f"  Compliance: {in_review} in review, {non_compliant} non-compliant\n"
        f"  Low Stock: {low_stock_str}\n\n"
        f"This is YOUR stores' data. "
        f"Flag urgent issues immediately (overdue compliance, critically low stock). "
        f"Data refreshes on every message."
    )


# ════════════════════════════════════════════════════════════════
# User — basic context, simple data
# ════════════════════════════════════════════════════════════════

def _user_snapshot(profile):
    from sales.models import Sale

    today = date.today()
    user_franchises = list(profile.franchises.all())

    if not user_franchises:
        return "\n\n=== NOTE ===\nThis user has no franchise assigned yet. Suggest they contact their admin."

    franchise_names = ', '.join(f.name for f in user_franchises)
    today_sales = Sale.objects.filter(franchise__in=user_franchises, sale_date__date=today).count()
    today_revenue = Sale.objects.filter(franchise__in=user_franchises, sale_date__date=today, status='completed').aggregate(s=Sum('total_amount'))['s'] or 0

    return (
        f"\n\n=== LIVE DATA — {franchise_names} ===\n"
        f"Refreshed: {today}\n"
        f"  Today at {franchise_names}: {today_sales} sales, ₹{int(today_revenue):,} revenue\n\n"
        f"Data refreshes on every message so it's always current."
    )


# ════════════════════════════════════════════════════════════════
# System Prompts
# ════════════════════════════════════════════════════════════════

SYSTEM_PROMPTS = {
    'admin': (
        "You are Nova, a quick assistant for FranchiseOS admins.\n"
        "You have live data for all franchises, users, and metrics.\n"
        "Keep replies under 3 lines. Use bullets only for lists.\n"
        "Reference specific numbers. Flag urgent issues with ⚠️."
    ),
    'franchise_owner': (
        "You are Orbit, a quick assistant for franchise owners.\n"
        "You have live data for their franchise(s) only.\n"
        "Keep replies under 3 lines. Be direct and practical.\n"
        "Use 📊 for data, ⚠️ for alerts, ✅ for actions."
    ),
    'store_manager': (
        "You are Pulse, a quick assistant for store managers.\n"
        "You have live data for their store(s).\n"
        "Keep replies under 3 lines. Number steps for how-to questions.\n"
        "Flag urgent issues with 🔴. Be fast and task-focused."
    ),
    'user': (
        "You are Scout, a friendly guide for new FranchiseOS users.\n"
        "Explain things simply. Keep replies under 4 lines.\n"
        "Number steps for instructions. Be encouraging 😊"
    ),
}

PAGE_CONTEXT = {
    'dashboard': "The user is viewing their Dashboard with summary stats and recent activity.",
    'sales': "The user is on the Sales page, managing sales transactions and viewing sales history.",
    'inventory': "The user is on the Inventory page, tracking stock levels across locations.",
    'products': "The user is on the Products page, managing the product catalog.",
    'expenses': "The user is on the Expenses page, recording and reviewing business expenses.",
    'approvals': "The user is on the Approvals page, managing approval requests (discounts, refunds, purchase orders, etc.).",
    'compliance': "The user is on the Compliance page, tracking compliance checklists and records.",
    'users': "The user is on the Users page, managing user accounts, roles, and franchise assignments.",
    'franchises': "The user is on the Franchises page, viewing and managing franchise locations.",
    'marketing': "The user is on the Marketing page, managing campaigns and reviewing leads.",
    'reports': "The user is on the Reports page, viewing generated analytics reports.",
    'audit': "The user is on the Audit Log page, reviewing system activity and change history.",
    'settings': "The user is on the Settings page, managing their profile and password.",
    'notifications': "The user is on the Notifications page, reviewing platform notifications.",
    'contact': "The user is on the Contact Support page.",
}


def build_system_prompt(role, page='', profile=None):
    """Build a role-specific system prompt with live data and page context."""
    prompt = SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS['user'])

    # Inject live data snapshot
    if profile:
        prompt += get_live_data(role, profile)

    if page:
        context_hint = PAGE_CONTEXT.get(page)
        if context_hint:
            prompt += f"\n\n{context_hint} Use this context to provide page-relevant suggestions."

    return prompt
