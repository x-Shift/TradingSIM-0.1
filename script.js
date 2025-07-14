// Trading Simulator JavaScript

class TradingSimulator {
  constructor() {
    this.balance = 100000
    this.selectedSymbol = "BTC/USD"
    this.orderType = "market"
    this.tradeType = "buy"
    this.trades = []
    this.positions = []
    this.chartData = []
    this.priceUpdateInterval = null
    this.chartUpdateInterval = null

    this.prices = {
      "BTC/USD": {
        symbol: "BTC/USD",
        price: 43250.0,
        change: 1250.5,
        changePercent: 2.98,
        high24h: 44100.0,
        low24h: 41800.0,
        volume: 28500000000,
        basePrice: 43250.0,
      },
      "ETH/USD": {
        symbol: "ETH/USD",
        price: 2650.75,
        change: -45.25,
        changePercent: -1.68,
        high24h: 2720.0,
        low24h: 2580.0,
        volume: 15200000000,
        basePrice: 2650.75,
      },
      "XRP/USD": {
        symbol: "XRP/USD",
        price: 0.6234,
        change: 0.0156,
        changePercent: 2.56,
        high24h: 0.645,
        low24h: 0.605,
        volume: 1800000000,
        basePrice: 0.6234,
      },
      "XAU/USD": {
        symbol: "XAU/USD",
        price: 2045.8,
        change: 12.3,
        changePercent: 0.61,
        high24h: 2055.2,
        low24h: 2032.1,
        volume: 850000000,
        basePrice: 2045.8,
      },
    }

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.renderMarketCards()
    this.initializeChart()
    this.startPriceUpdates()
    this.updateUI()
  }

  setupEventListeners() {
    // Trade tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
        e.target.classList.add("active")
        this.tradeType = e.target.dataset.type
        this.updateTradeButton()
      })
    })

    // Order type buttons
    document.querySelectorAll(".order-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".order-btn").forEach((b) => b.classList.remove("active"))
        e.target.classList.add("active")
        this.orderType = e.target.dataset.type
        this.togglePriceInput()
        this.updateOrderSummary()
      })
    })

    // Input events
    document.getElementById("amountInput").addEventListener("input", () => this.updateOrderSummary())
    document.getElementById("priceInput").addEventListener("input", () => this.updateOrderSummary())

    // Trade button
    document.getElementById("tradeBtn").addEventListener("click", () => this.executeTrade())
  }

  renderMarketCards() {
    const container = document.getElementById("marketCards")
    container.innerHTML = ""

    Object.values(this.prices).forEach((price) => {
      const card = document.createElement("div")
      card.className = `market-card ${price.symbol === this.selectedSymbol ? "active" : ""}`
      card.onclick = () => this.selectSymbol(price.symbol)

      card.innerHTML = `
                <div class="market-symbol">${price.symbol}</div>
                <div class="market-price">$${this.formatPrice(price.price, price.symbol)}</div>
                <div class="market-change ${price.changePercent >= 0 ? "positive" : "negative"}">
                    ${price.changePercent >= 0 ? "+" : ""}${price.changePercent.toFixed(2)}%
                </div>
            `

      container.appendChild(card)
    })
  }

  selectSymbol(symbol) {
    this.selectedSymbol = symbol
    this.renderMarketCards()
    this.updateTradingPanel()
    this.updateOrderBook()
    this.initializeChart()
    document.getElementById("chartTitle").textContent = `${symbol} Price Chart`
  }

  updateTradingPanel() {
    document.getElementById("tradingSymbol").textContent = this.selectedSymbol
    this.updateOrderSummary()
    this.updateMaxAmount()
  }

  updateMaxAmount() {
    const currentPrice = this.prices[this.selectedSymbol].price
    const maxAmount = this.tradeType === "buy" ? this.balance / currentPrice : 0
    document.getElementById("maxAmount").textContent = maxAmount.toFixed(8)
  }

  togglePriceInput() {
    const priceInputGroup = document.getElementById("priceInputGroup")
    priceInputGroup.style.display = this.orderType === "limit" ? "block" : "none"
  }

  updateOrderSummary() {
    const amount = Number.parseFloat(document.getElementById("amountInput").value) || 0
    const currentPrice = this.prices[this.selectedSymbol].price
    const price =
      this.orderType === "market"
        ? currentPrice
        : Number.parseFloat(document.getElementById("priceInput").value) || currentPrice
    const total = amount * price

    document.getElementById("orderPrice").textContent = `$${price.toFixed(2)}`
    document.getElementById("orderAmount").textContent = amount.toFixed(8)
    document.getElementById("orderTotal").textContent = `$${total.toFixed(2)}`

    // Update trade button state
    const tradeBtn = document.getElementById("tradeBtn")
    const canTrade = amount > 0 && price > 0 && (this.tradeType === "sell" || total <= this.balance)
    tradeBtn.disabled = !canTrade
  }

  updateTradeButton() {
    const tradeBtn = document.getElementById("tradeBtn")
    const symbol = this.selectedSymbol.split("/")[0]

    tradeBtn.textContent = `${this.tradeType.toUpperCase()} ${symbol}`
    tradeBtn.className = `trade-btn ${this.tradeType}-btn`
  }

  executeTrade() {
    const amount = Number.parseFloat(document.getElementById("amountInput").value)
    const currentPrice = this.prices[this.selectedSymbol].price
    const price =
      this.orderType === "market" ? currentPrice : Number.parseFloat(document.getElementById("priceInput").value)
    const total = amount * price
    const fee = total * 0.001 // 0.1% fee

    if (this.tradeType === "buy" && this.balance < total + fee) {
      alert("Insufficient balance!")
      return
    }

    // Create trade record
    const trade = {
      id: Date.now().toString(),
      symbol: this.selectedSymbol,
      type: this.tradeType,
      amount: amount,
      price: price,
      timestamp: new Date(),
      total: total + fee,
    }

    this.trades.unshift(trade)

    // Update balance
    if (this.tradeType === "buy") {
      this.balance -= total + fee
    } else {
      this.balance += total - fee
    }

    // Update positions
    this.updatePositions(this.tradeType, amount, price)

    // Clear inputs
    document.getElementById("amountInput").value = ""
    document.getElementById("priceInput").value = ""

    // Update UI
    this.updateUI()
    this.renderOrderHistory()
    this.renderPortfolio()

    // Show success message
    this.showNotification(`${this.tradeType.toUpperCase()} order executed successfully!`)
  }

  updatePositions(type, amount, price) {
    const existingPosition = this.positions.find((p) => p.symbol === this.selectedSymbol)

    if (!existingPosition) {
      if (type === "buy") {
        this.positions.push({
          symbol: this.selectedSymbol,
          amount: amount,
          averagePrice: price,
          currentValue: amount * this.prices[this.selectedSymbol].price,
          pnl: 0,
          pnlPercent: 0,
        })
      }
      return
    }

    const newAmount = type === "buy" ? existingPosition.amount + amount : existingPosition.amount - amount

    if (newAmount <= 0) {
      this.positions = this.positions.filter((p) => p.symbol !== this.selectedSymbol)
      return
    }

    const newAveragePrice =
      type === "buy"
        ? (existingPosition.averagePrice * existingPosition.amount + price * amount) / newAmount
        : existingPosition.averagePrice

    const currentValue = newAmount * this.prices[this.selectedSymbol].price
    const pnl = currentValue - newAmount * newAveragePrice
    const pnlPercent = (pnl / (newAmount * newAveragePrice)) * 100

    existingPosition.amount = newAmount
    existingPosition.averagePrice = newAveragePrice
    existingPosition.currentValue = currentValue
    existingPosition.pnl = pnl
    existingPosition.pnlPercent = pnlPercent
  }

  startPriceUpdates() {
    this.priceUpdateInterval = setInterval(() => {
      Object.keys(this.prices).forEach((symbol) => {
        const price = this.prices[symbol]
        const volatility = this.getVolatility(symbol)
        const change = (Math.random() - 0.5) * price.price * volatility
        const newPrice = Math.max(0, price.price + change)

        price.price = newPrice
        price.change = newPrice - price.basePrice
        price.changePercent = (price.change / price.basePrice) * 100
      })

      this.renderMarketCards()
      this.updateCurrentPrice()
      this.updateOrderBook()
      this.updatePositionsPnL()
      this.updateUI()
    }, 1000)
  }

  getVolatility(symbol) {
    const volatilities = {
      "BTC/USD": 0.002,
      "ETH/USD": 0.003,
      "XRP/USD": 0.005,
      "XAU/USD": 0.001,
    }
    return volatilities[symbol] || 0.002
  }

  updateCurrentPrice() {
    const price = this.prices[this.selectedSymbol]
    document.getElementById("currentPrice").textContent = `$${this.formatPrice(price.price, this.selectedSymbol)}`

    const changeElement = document.getElementById("priceChange")
    changeElement.textContent = `${price.changePercent >= 0 ? "+" : ""}${price.changePercent.toFixed(2)}%`
    changeElement.className = `price-change ${price.changePercent >= 0 ? "positive" : "negative"}`
  }

  updateOrderBook() {
    const currentPrice = this.prices[this.selectedSymbol].price

    // Generate mock order book data
    const asks = this.generateOrderBookData(currentPrice, false)
    const bids = this.generateOrderBookData(currentPrice, true)

    this.renderOrderBookSide("asks", asks, "negative")
    this.renderOrderBookSide("bids", bids, "positive")
  }

  generateOrderBookData(basePrice, isBid) {
    const orders = []
    let total = 0

    for (let i = 0; i < 8; i++) {
      const priceOffset = (Math.random() * 0.01 + 0.001) * basePrice
      const price = isBid ? basePrice - priceOffset : basePrice + priceOffset
      const amount = Math.random() * 10 + 0.1
      total += amount

      orders.push({ price, amount, total })
    }

    return orders.sort((a, b) => (isBid ? b.price - a.price : a.price - b.price))
  }

  renderOrderBookSide(containerId, orders, colorClass) {
    const container = document.getElementById(containerId)
    container.innerHTML = ""

    orders.forEach((order) => {
      const row = document.createElement("div")
      row.className = "order-row"
      row.innerHTML = `
                <div class="${colorClass}">${this.formatPrice(order.price, this.selectedSymbol)}</div>
                <div>${order.amount.toFixed(4)}</div>
                <div style="color: rgba(255,255,255,0.6)">${order.total.toFixed(4)}</div>
            `
      container.appendChild(row)
    })
  }

  updatePositionsPnL() {
    this.positions.forEach((position) => {
      const currentPrice = this.prices[position.symbol].price
      const currentValue = position.amount * currentPrice
      const pnl = currentValue - position.amount * position.averagePrice
      const pnlPercent = (pnl / (position.amount * position.averagePrice)) * 100

      position.currentValue = currentValue
      position.pnl = pnl
      position.pnlPercent = pnlPercent
    })

    this.renderPortfolio()
  }

  renderPortfolio() {
    const container = document.getElementById("portfolioContent")

    if (this.positions.length === 0) {
      container.innerHTML = '<div class="empty-state">No open positions</div>'
      return
    }

    container.innerHTML = ""
    this.positions.forEach((position) => {
      const item = document.createElement("div")
      item.className = "position-item"
      item.innerHTML = `
                <div class="position-header">
                    <div class="position-symbol">${position.symbol}</div>
                    <div class="position-pnl ${position.pnl >= 0 ? "positive" : "negative"}">
                        ${position.pnl >= 0 ? "+" : ""}$${position.pnl.toFixed(2)}
                    </div>
                </div>
                <div class="position-details">
                    <div>Amount: ${position.amount.toFixed(6)}</div>
                    <div>Value: $${position.currentValue.toFixed(2)}</div>
                    <div>Avg Price: $${position.averagePrice.toFixed(2)}</div>
                    <div class="${position.pnlPercent >= 0 ? "positive" : "negative"}">
                        ${position.pnlPercent >= 0 ? "+" : ""}${position.pnlPercent.toFixed(2)}%
                    </div>
                </div>
            `
      container.appendChild(item)
    })
  }

  renderOrderHistory() {
    const container = document.getElementById("historyContent")

    if (this.trades.length === 0) {
      container.innerHTML = '<div class="empty-state">No trades yet</div>'
      return
    }

    container.innerHTML = ""
    this.trades.slice(0, 10).forEach((trade) => {
      const item = document.createElement("div")
      item.className = "trade-item"
      item.innerHTML = `
                <div class="trade-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="trade-type ${trade.type}">${trade.type}</span>
                        <span style="font-weight: 600; font-size: 12px;">${trade.symbol}</span>
                    </div>
                    <div class="trade-time">${trade.timestamp.toLocaleTimeString()}</div>
                </div>
                <div class="trade-details">
                    <div>
                        <div>Amount</div>
                        <div style="font-family: monospace;">${trade.amount.toFixed(6)}</div>
                    </div>
                    <div>
                        <div>Price</div>
                        <div style="font-family: monospace;">$${trade.price.toFixed(2)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div>Total</div>
                        <div style="font-family: monospace;">$${trade.total.toFixed(2)}</div>
                    </div>
                </div>
            `
      container.appendChild(item)
    })
  }

  initializeChart() {
    const canvas = document.getElementById("priceChart")
    const ctx = canvas.getContext("2d")

    // Initialize chart data
    this.chartData = []
    const basePrice = this.prices[this.selectedSymbol].price
    const now = new Date()

    for (let i = 59; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000)
      const variation = (Math.random() - 0.5) * basePrice * 0.02
      this.chartData.push({
        time: time,
        price: basePrice + variation,
      })
    }

    this.startChartUpdates()
  }

  startChartUpdates() {
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval)
    }

    this.chartUpdateInterval = setInterval(() => {
      const currentPrice = this.prices[this.selectedSymbol].price
      this.chartData.shift()
      this.chartData.push({
        time: new Date(),
        price: currentPrice,
      })
      this.drawChart()
    }, 1000)

    this.drawChart()
  }

  drawChart() {
    const canvas = document.getElementById("priceChart")
    const ctx = canvas.getContext("2d")

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (this.chartData.length < 2) return

    const prices = this.chartData.map((d) => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = (canvas.height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw price line
    ctx.strokeStyle = "#3B82F6"
    ctx.lineWidth = 2
    ctx.beginPath()

    this.chartData.forEach((point, index) => {
      const x = (index / (this.chartData.length - 1)) * canvas.width
      const y = canvas.height - ((point.price - minPrice) / priceRange) * canvas.height

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw current price point
    if (this.chartData.length > 0) {
      const lastPoint = this.chartData[this.chartData.length - 1]
      const x = canvas.width
      const y = canvas.height - ((lastPoint.price - minPrice) / priceRange) * canvas.height

      ctx.fillStyle = "#3B82F6"
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  updateUI() {
    // Update balance
    document.getElementById("balance").textContent =
      `$${this.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`

    // Update portfolio total
    const portfolioValue = this.balance + this.positions.reduce((sum, pos) => sum + pos.currentValue, 0)
    document.getElementById("portfolio").textContent =
      `$${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    document.getElementById("portfolioTotal").textContent =
      `$${this.positions.reduce((sum, pos) => sum + pos.currentValue, 0).toFixed(2)}`

    this.updateOrderSummary()
    this.updateMaxAmount()
  }

  formatPrice(price, symbol) {
    const decimals = symbol.includes("XRP") ? 4 : 2
    return price.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  showNotification(message) {
    // Create notification element
    const notification = document.createElement("div")
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(34, 197, 94, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `
    notification.textContent = message

    document.body.appendChild(notification)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}

// Initialize the trading simulator when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new TradingSimulator()
})
