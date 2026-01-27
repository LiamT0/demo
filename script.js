// Page Navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName).classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Settings Tabs
function showSettingsTab(tabName) {
    document.querySelectorAll('.settings-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(tabName + '-tab').style.display = 'block';

    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Revenue Chart
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 102, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 102, 255, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
            datasets: [{
                label: 'Revenue',
                data: [15200, 18400, 19800, 17600, 22100, 24800],
                borderColor: '#0066FF',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#0066FF',
                pointBorderColor: '#0A0E1A',
                pointBorderWidth: 3,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1E2435',
                    borderColor: '#2A3140',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#2A3140',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            family: 'Sora'
                        }
                    }
                },
                y: {
                    grid: {
                        color: '#2A3140',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            family: 'Sora'
                        },
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });

    // Add interactivity to action cards
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.action-title').textContent;
            alert('This would open the ' + title + ' interface');
        });
    });
});
