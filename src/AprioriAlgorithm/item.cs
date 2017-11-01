using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AprioriAlgorithm
{
    public class Item : IEquatable<Item>
    {
        public List<int> Pattern;
        public int Count;
        public Item(List<int> p)
        {
            Pattern = p;
            Count = 0;
        }
        public Item(List<int> p, int c)
        {
            Pattern = p;
            Count = c;
        }

        public bool Equals(Item other)
        {
            List<int> p1 = Pattern.Select(x => x).ToList();
            List<int> p2 = other.Pattern.Select(x => x).ToList();

            p1.Sort();
            p2.Sort();

            for (int i = 0; i < p1.Count; i++)
            {
                if (p1[i] != p2[i]) return false;
            }

            return true;
        }
    }
}