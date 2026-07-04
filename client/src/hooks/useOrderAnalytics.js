import { useState, useEffect } from 'react';
import { getDatabase } from '../db/database';

export const useOrderAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topProducts: [],
    isLoading: true,
  });

  useEffect(() => {
    let sub;

    getDatabase().then((db) => {
      sub = db.orders
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          let revenue = 0;
          const productMap = {};

          docs.forEach((doc) => {
            revenue += doc.totalAmount || 0;
            (doc.items || []).forEach((item) => {
              if (!item.name) return;
              if (!productMap[item.name]) {
                productMap[item.name] = { qty: 0, revenue: 0 };
              }
              productMap[item.name].qty += item.quantity || 0;
              productMap[item.name].revenue +=
                (item.price || 0) * (item.quantity || 0);
            });
          });

          const count = docs.length;

          const topProducts = Object.entries(productMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

          setAnalytics({
            totalRevenue: revenue,
            totalOrders: count,
            avgOrderValue: count > 0 ? revenue / count : 0,
            topProducts,
            isLoading: false,
          });
        });
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  return analytics;
};
