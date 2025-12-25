// services/SuperAdminServices.js - CLEANED UP VERSION
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const BusinessType = require('../models/BusinessType');
const Orders = require('../models/Orders');
const InventoryBase = require('../models/InventoryBase');
const Drivers = require('../models/Drivers');
const Location = require('../models/Locations');
const pool = require('../config/databaseTable');

const { ORDER_STATUS, DELIVERY_STATUS } = require('../utils/orderConstants');
const Vendor = require('../models/Vendor');
const Delivery = require('../models/Delivery');

class SuperAdminServices {
  // Helper method for database queries
  static async _query(sql, params = []) {
    const { rows } = await pool.query(sql, params);
    return rows;
  }

  static async _querySingle(sql, params = []) {
    const rows = await this._query(sql, params);
    return rows[0] || null;
  }

  static async _execute(sql, params = []) {
    const result = await pool.query(sql, params);
    return result;
  }

static async getDashboard(req) {
    try {
        // Get platform statistics
        const platformStats = await this._querySingle(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'user') as total_customers,
                (SELECT COUNT(*) FROM vendor) as total_vendors,
                (SELECT COUNT(*) FROM vendor WHERE status = false) as pending_vendors,
                (SELECT COUNT(*) FROM orders) as total_orders,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid') as total_revenue,
                (SELECT COUNT(*) FROM shelf) as total_products,
                (SELECT COUNT(*) FROM drivers WHERE verified = true) as total_drivers,
                (SELECT COALESCE(SUM(cashback), 0) FROM users) as total_cashback_issued,
                (SELECT COUNT(*) FROM deliveries WHERE status = 'ready_for_pickup') as pending_deliveries,
                (SELECT COUNT(*) FROM deliveries WHERE status = 'delivered') as completed_deliveries
        `);

        // Get recent orders
        const recentOrders = await this._query(`
            SELECT 
                o.*, 
                v.business_name,
                u.first_name as customer_first_name,
                u.last_name as customer_last_name,
                u.email as customer_email
            FROM orders o 
            LEFT JOIN vendor v ON o.vendor_id = v.id 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC 
            LIMIT 10
        `);

        // Get pending vendor applications
        const pendingVendors = await this._query(`
            SELECT 
                v.*, 
                u.email, 
                u.first_name, 
                u.last_name, 
                bt.name as business_type
            FROM vendor v 
            LEFT JOIN users u ON v.user_id = u.id 
            LEFT JOIN business_type bt ON v.business_type_id = bt.id 
            WHERE v.status = false 
            ORDER BY v.created_at DESC 
            LIMIT 5
        `);

        // Get recent deliveries
        const recentDeliveries = await this._query(`
            SELECT d.*, 
                   o.order_number,
                   v.business_name,
                   dr.company_name as driver_company
            FROM deliveries d
            JOIN orders o ON o.id = d.order_id
            JOIN vendor v ON v.id = o.vendor_id
            LEFT JOIN drivers dr ON dr.id = d.driver_id
            ORDER BY d.created_at DESC 
            LIMIT 10
        `);

        // Get sales analytics (last 30 days)
        const salesAnalytics = await this._query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as daily_revenue
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND payment_status = 'paid'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        // Get top performing vendors
        const topVendors = await this._query(`
            SELECT 
                v.business_name,
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total_amount), 0) as total_revenue
            FROM vendor v
            LEFT JOIN orders o ON v.id = o.vendor_id AND o.payment_status = 'paid'
            WHERE v.status = true
            GROUP BY v.id, v.business_name
            ORDER BY total_revenue DESC
            LIMIT 5
        `);

        return {
            pageTitle: "Super Admin Dashboard",
            platformStats,
            recentOrders,
            recentDeliveries,
            pendingVendors,
            salesAnalytics,
            topVendors,
            userActive: true
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw new Error(`Error loading dashboard: ${error.message}`);
    }
}



  static async updateVendorStatus(req) {
    const { vendorId } = req.params;
    const { status } = req.body;

    try {
      // Use Vendor model
      const Vendor = require('../models/Vendor');
      const result = await Vendor.updateStatus(vendorId, status === 'true');

      if (!result) {
        throw new Error('Vendor not found');
      }

      return { 
        success: true, 
        message: `Vendor ${status === 'true' ? 'approved' : 'rejected'} successfully` 
      };
    } catch (error) {
      console.error('Error updating vendor status:', error);
      throw new Error(`Error updating vendor status: ${error.message}`);
    }
  }

  // Order Management - Use Orders model methods
  static async getAllOrders(req) {
    try {
      const orders = await Orders.getOrders(req.query);
      const vendors = await this._query(`SELECT id, business_name FROM vendor WHERE status = true`);
      const orderStatuses = Object.values(ORDER_STATUS);

      return {
        pageTitle: "All Orders",
        orders,
        vendors,
        orderStatuses,
        filters: req.query,
        userActive: true
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error(`Error loading orders: ${error.message}`);
    }
  }

  static async getOrderDetails(req) {
    const { orderId } = req.params;

    try {
      const order = await Orders.getById(orderId);
    
      if (!order) {
        throw new Error('Order not found');
      }

      return {
        pageTitle: `Order #${order.order_number || orderId}`,
        order:order,
        orderItems:order.orderItems,
        delivery: order.delivery,
        userActive: true
      };
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw new Error(`Error loading order details: ${error.message}`);
    }
  }



static async updateOrderReceived(req) {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    
      // Update order status
      await Orders.updateStatus(orderId, 'ready_for_pickup');
      
  
      return {
        success: true,
        message: `Order status updated to ${status} successfully`,
      };
      
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error(`Error updating order status: ${error.message}`);
  }
}


static async getAllVendors(req) {
    try {
        const vendors = await Vendor.getAllWithStats(req.query);
        const businessTypes = await BusinessType.listAll();
        const states = await Location.getAllStates();

        return {
            pageTitle: "All Vendors",
            vendors,
            businessTypes,
            states,
            filters: req.query,
            userActive: true
        };
    } catch (error) {
        console.error('Error fetching vendors:', error);
        throw new Error(`Error loading vendors: ${error.message}`);
    }
}

static async getVendorDetails(req) {
    const { vendorId } = req.params;

    try {
        const data = await Vendor.getByIdWithDetails(vendorId);

        if (!data) {
            throw new Error('Vendor not found');
        }
        
        return {
            pageTitle: `Vendor - ${data.business_name}`,
            vendor:data.vendor, 
            recentProducts:data.recentProducts,
            vendorStats:data.vendorStats,
            recentOrders:data.recentOrders,
            userActive:true
        };
    } catch (error) {
        console.error('Error fetching vendor details:', error);
        throw new Error(`Error loading vendor details: ${error.message}`);
    }
}

// User Management
static async getAllUsers(req) {
    try {
        const users = await User.getAllWithStats(req.query);

        return {
            pageTitle: "All Users",
            users,
            filters: req.query,
            userActive: true
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error(`Error loading users: ${error.message}`);
    }
}

static async getUserDetails(req) {
    const { userId } = req.params;

    try {
        const data = await User.getByIdWithStats(userId);
        
        if (!data) {
            throw new Error('User not found');
        }

        return {
            pageTitle: `User - ${data.first_name} ${data.last_name}`,
            user:data,
            recentOrders:data.recentOrders,
            userActive: true
        };
    } catch (error) {
        console.error('Error fetching user details:', error);
        throw new Error(`Error loading user details: ${error.message}`);
    }
}

  // Driver Management - Use Drivers model methods
  static async getAllDrivers(req) {
    try {
      const drivers = await Drivers.getAllDrivers(req.query);
      const states = await Location.getAllStates();

      return {
        pageTitle: "All Drivers",
        drivers,
        states,
        filters: req.query,
        userActive: true
      };
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw new Error(`Error loading drivers: ${error.message}`);
    }
  }

  static async verifyDriver(req) {
    const { driverId } = req.params;

    try {
      const result = await Drivers.verifyDriver(driverId);

      if (!result) {
        throw new Error('Driver not found');
      }

      return { 
        success: true, 
        message: 'Driver verified successfully' 
      };
    } catch (error) {
      console.error('Error verifying driver:', error);
      throw new Error(`Error verifying driver: ${error.message}`);
    }
  }



  static async createBusinessType(req) {
    const { name, description, requirements } = req.body;

    try {
      const id = uuidv4();
      await BusinessType.create({ id, name, description, requirements });

      // Create corresponding inventory table
      await InventoryBase.createInventoryTable(name, id);

      return { 
        success: true, 
        message: `Business type "${name}" created successfully` 
      };
    } catch (error) {
      console.error('Error creating business type:', error);
      throw new Error(`Error creating business type: ${error.message}`);
    }
  }

  // Delivery Management Methods (NEW)
  // Create delivery when order is ready for pickup
  static async _createDeliveryForOrder(order) {
    try {
      // Check if delivery already exists for this order
      const existingDelivery = await this._querySingle(
        `SELECT id FROM deliveries WHERE order_id = $1`,
        [order.id]
      );

      if (existingDelivery) {
        // Update existing delivery to ready for pickup
        await this._execute(
          `UPDATE deliveries 
           SET status = 'ready_for_pickup', updated_at = NOW()
           WHERE order_id = $1`,
          [order.id]
        );
        console.log(`Delivery updated for order ${order.id}`);
        return;
      }

      // Create new delivery record
      const deliveryData = {
        delivery_address: order.shipping_address || 'Address not provided',
        customer_phone: order.customer_phone,
        customer_name: `${order.customer_first_name} ${order.customer_last_name}`,
        customer_email: order.customer_email,
        pickup_location: order.vendor_address || 'Vendor Location',
        vendor_name: order.business_name,
        order_amount: order.total_amount,
        vendor_state: order.vendor_state
      };

      const deliveryId = uuidv4();
      
      await this._execute(
        `INSERT INTO deliveries (
          id, order_id, delivery_address, customer_phone, customer_name,
          customer_email, pickup_location, vendor_name, order_amount,
          vendor_state, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ready_for_pickup')`,
        [
          deliveryId,
          order.id,
          deliveryData.delivery_address,
          deliveryData.customer_phone,
          deliveryData.customer_name,
          deliveryData.customer_email,
          deliveryData.pickup_location,
          deliveryData.vendor_name,
          deliveryData.order_amount,
          deliveryData.vendor_state
        ]
      );

      console.log(`Delivery created for order ${order.id}`);
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw error;
    }
  }

  // Update delivery status
  static async _updateDeliveryStatus(orderId, status) {
    try {
      await this._execute(
        `UPDATE deliveries 
         SET status = $1, updated_at = NOW()
         WHERE order_id = $2`,
        [status, orderId]
      );
      console.log(`Delivery status updated to ${status} for order ${orderId}`);
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  // Get all available deliveries for drivers
  static async getAvailableDeliveries() {
    try {
      const deliveries = await this._query(`
        SELECT d.*, 
               o.order_number, o.total_amount,
               o.customer_first_name, o.customer_last_name, o.customer_email,
               v.business_name, v.state as vendor_state,
               v.company_address as pickup_location
        FROM deliveries d
        JOIN orders o ON o.id = d.order_id
        JOIN vendor v ON v.id = o.vendor_id
        WHERE d.status = 'ready_for_pickup'
        AND d.driver_id IS NULL
        ORDER BY d.created_at DESC
      `);

      return deliveries;
    } catch (error) {
      console.error('Error getting available deliveries:', error);
      return [];
    }
  }

  // Get all deliveries with driver info
  static async getAllDeliveries(filters = {}) {
    try {
      let query = `
        SELECT d.*, 
               o.order_number, o.total_amount,
               o.customer_first_name, o.customer_last_name,
               v.business_name,
               dr.company_name as driver_company,
               dr.company_phone as driver_phone
        FROM deliveries d
        JOIN orders o ON o.id = d.order_id
        JOIN vendor v ON v.id = o.vendor_id
        LEFT JOIN drivers dr ON dr.id = d.driver_id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      // Apply filters
      if (filters.status) {
        paramCount++;
        query += ` AND d.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.driver_id) {
        paramCount++;
        query += ` AND d.driver_id = $${paramCount}`;
        params.push(filters.driver_id);
      }

      if (filters.vendor_state) {
        paramCount++;
        query += ` AND v.state = $${paramCount}`;
        params.push(filters.vendor_state);
      }

      if (filters.start_date) {
        paramCount++;
        query += ` AND d.created_at >= $${paramCount}`;
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        paramCount++;
        query += ` AND d.created_at <= $${paramCount}`;
        params.push(filters.end_date);
      }

      query += ` ORDER BY d.created_at DESC`;

      return await this._query(query, params);
    } catch (error) {
      console.error('Error getting all deliveries:', error);
      return [];
    }
  }

  // Get delivery details
  static async getDeliveryDetails(deliveryId) {
    try {
      const delivery = await this._querySingle(`
        SELECT d.*, 
               o.order_number, o.total_amount, o.status as order_status,
               o.customer_first_name, o.customer_last_name, o.customer_email,
               v.business_name, v.company_address as vendor_address,
               v.state as vendor_state,
               dr.company_name as driver_company,
               dr.company_phone as driver_phone,
               dr.vehicle_type
        FROM deliveries d
        JOIN orders o ON o.id = d.order_id
        JOIN vendor v ON v.id = o.vendor_id
        LEFT JOIN drivers dr ON dr.id = d.driver_id
        WHERE d.id = $1
      `, [deliveryId]);

      return delivery;
    } catch (error) {
      console.error('Error getting delivery details:', error);
      return null;
    }
  }

  // Assign driver to delivery
  static async assignDriverToDelivery(req) {
    const { deliveryId } = req.params;
    const { driverId } = req.body;

    try {
      // Check if driver exists and is verified
      const driver = await Drivers.getById(driverId);

      if (!driver || !driver.verified) {
        throw new Error('Driver not found or not verified');
      }

      // Check if delivery is available
      const delivery = await this._querySingle(
        `SELECT * FROM deliveries WHERE id = $1 AND status = 'ready_for_pickup' AND driver_id IS NULL`,
        [deliveryId]
      );

      if (!delivery) {
        throw new Error('Delivery not available or already assigned');
      }

      // Assign driver to delivery
      const result = await this._execute(
        `UPDATE deliveries 
         SET driver_id = $1, status = 'picked_up', assigned_at = NOW(), updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [driverId, deliveryId]
      );

      // Update order status to picked_up
      await Orders.updateStatus(delivery.order_id, 'picked_up');

      return {
        success: true,
        message: 'Driver assigned to delivery successfully',
        delivery: result.rows[0]
      };
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw new Error(`Error assigning driver: ${error.message}`);
    }
  }

  // Reports and Analytics
  static async getSalesReport(req) {
    try {
      const { period = '30days', date_from, date_to } = req.query;

      // Build base query and parameters
      let whereClause = '';
      const params = [];

      if (date_from && date_to) {
        whereClause = 'WHERE DATE(o.created_at) BETWEEN $1 AND $2 AND o.payment_status = $3';
        params.push(date_from, date_to, 'paid');
      } else {
        // Default to last 30 days or 7 days
        const interval = period === '7days' ? '7 days' : '30 days';
        whereClause = 'WHERE o.created_at >= CURRENT_DATE - INTERVAL \'' + interval + '\' AND o.payment_status = $1';
        params.push('paid');
      }

      const salesReport = await this._query(`
        SELECT 
          DATE(o.created_at) as date,
          COUNT(DISTINCT o.id) as order_count,
          COUNT(DISTINCT o.user_id) as customer_count,
          COUNT(DISTINCT o.vendor_id) as vendor_count,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(AVG(o.total_amount), 0) as average_order_value
        FROM orders o
        ${whereClause}
        GROUP BY DATE(o.created_at)
        ORDER BY date DESC
      `, params);

      const summary = await this._querySingle(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(DISTINCT o.user_id) as total_customers,
          COUNT(DISTINCT o.vendor_id) as total_vendors,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(AVG(o.total_amount), 0) as average_order_value
        FROM orders o
        ${whereClause}
      `, params);

      return {
        pageTitle: "Sales Report",
        salesReport,
        summary: summary || {},
        filters: { period, date_from, date_to },
        userActive: true
      };
    } catch (error) {
      console.error('Error generating sales report:', error);
      throw new Error(`Error generating sales report: ${error.message}`);
    }
  }

  static async getPlatformAnalytics(req) {
    try {
      const userGrowth = await this._query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users
        FROM users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      const vendorGrowth = await this._query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_vendors
        FROM vendor 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      const orderTrends = await this._query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND payment_status = 'paid'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      return {
        pageTitle: "Platform Analytics",
        userGrowth,
        vendorGrowth,
        orderTrends,
        userActive: true
      };
    } catch (error) {
      console.error('Error generating platform analytics:', error);
      throw new Error(`Error generating platform analytics: ${error.message}`);
    }
  }
}

module.exports = SuperAdminServices;