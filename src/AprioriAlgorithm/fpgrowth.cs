using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.IO;

namespace AprioriAlgorithm
{
    public class Pattern
    {
        public List<int> Items;
        public int PtnCnt;

        public Pattern()
        {
            Items = new List<int>();
            PtnCnt = 0;
        }

        public Pattern(List<int> p)
        {
            Items = p;
            PtnCnt = 0;
        }

        public Pattern(List<int> p, int c)
        {
            Items = p;
            PtnCnt = c;
        }

        public int this[int i] { get { return Items[i]; } }

        public void SortItems(HeadTable ht)//sort pattern by item id support count
        {
            for (int i = 0; i < Items.Count - 1; i++)
            {
                for (int j = 0; j < Items.Count - 1 - i; j++)
                {
                    if (ht.Count[Items[j]] < ht.Count[Items[j + 1]])
                    {
                        int temp = Items[j];
                        Items[j] = Items[j + 1];
                        Items[j + 1] = temp;
                    }
                }
            }
        }
    }

    public class Node
    {
        public Pattern Ptn;
        public Node Father;
        public List<Node> Children;
        public Node Next;

        public Node()//root
        {
            Ptn = new Pattern();
            Father = null;
            Children = new List<Node>();
            Next = null;
        }

        public Node(Pattern p, Node f)
        {
            Ptn = p;
            Father = f;
            Children = new List<Node>();
            Next = null;
        }

        public int this[int i] { get { return Ptn[i]; } }
    }

    public class HeadNodeSorter : IComparer<HeadNode>
    {
        int IComparer<HeadNode>.Compare(HeadNode x, HeadNode y)
        {
            if (x.Ptn.PtnCnt != y.Ptn.PtnCnt) return x.Ptn.PtnCnt - y.Ptn.PtnCnt;
            else return x.Ptn.Items[0] - x.Ptn.Items[0];
        }

    }

    public class HeadNode
    {
        public Pattern Ptn;
        public Node FirstNode;

        public HeadNode(Pattern p)
        {
            Ptn = p;
            FirstNode = null;
        }
    }

    public class HeadTable
    {
        public List<HeadNode> HeadNodes;
        public Dictionary<int, int> Count;
        public Dictionary<int, int> Index;

        public HeadTable()
        {
            HeadNodes = new List<HeadNode>();
            Count = new Dictionary<int, int>();
            Index = new Dictionary<int, int>();
        }

        public HeadNode this[int i] { get { return HeadNodes[i]; } }

        public IEnumerator GetEnumerator()
        {
            foreach (HeadNode hn in HeadNodes)
                yield return hn;
        }

        public void CalcIndex()
        {
            for (int i = 0; i < HeadNodes.Count; i++)
            {
                Index.Add(HeadNodes[i].Ptn[0], i);
            }
        }

    }

    public class FPTree
    {
        public List<Pattern> ConditionalPatternBase;
        public HeadTable HeadTable;
        public Node Root;

        public FPTree()
        {
            ConditionalPatternBase = new List<Pattern>();
            HeadTable = new HeadTable();
            Root = new Node();
        }

    }

    public class FPGrowth
    {
        public List<List<int>> DSProcessed;
        public double MinSupportDbl;
        public int MinSupportInt;
        public List<List<Item>> L;
        public List<Pattern> Patterns;
        public FPTree FP_Tree;

        public FPGrowth(List<List<int>> dsp, double ms)
        {
            DSProcessed = dsp;
            MinSupportDbl = ms;
            MinSupportInt = (int)(DSProcessed.Count * MinSupportDbl);
            FP_Tree = new FPTree();
            L = new List<List<Item>>();
            Patterns = new List<Pattern>();
        }

        public FPTree Preproccess(List<Pattern> ptns)//generate headtable, fptree
        {
            if (ptns.Count == 0) return new FPTree();

            FPTree fptree = new FPTree();

            List<int> hash = Enumerable.Repeat(0, ptns.Select(x => x.Items.Max()).Max() + 1).ToList();

            //calc item count
            List<List<int>> lli = ptns.Select(x => x.Items).ToList();
            for (int i = 0; i < lli.Count; i++)
            {
                for (int j = 0; j < lli[i].Count; j++)
                {
                    hash[lli[i][j]] += ptns[i].PtnCnt;
                }
            }

            //generate headtable
            for (int i = 0; i < hash.Count; i++)
            {
                if (hash[i] >= MinSupportInt)
                {
                    fptree.HeadTable.HeadNodes.Add(new HeadNode(new Pattern(new List<int>() { i }, hash[i])));
                    fptree.HeadTable.Count.Add(i, hash[i]);
                }
            }

            IComparer<HeadNode> PS = new HeadNodeSorter();
            fptree.HeadTable.HeadNodes.Sort(PS);

            fptree.HeadTable.CalcIndex();

            return fptree;
        }

        //public Pattern DeleteItems(Pattern ptn, HeadTable ht)
        //{
        //    if (ht.HeadNodes.Count == 0) return new Pattern(new List<int>(), Int32.MaxValue);

        //    List<int> hash = Enumerable.Repeat(0, ht.HeadNodes.Max(x => x.Ptn.Items.Max()) + 1).ToList();

        //    for (int i = 0; i < ht.HeadNodes.Count; i++)
        //    {
        //        hash[ht.HeadNodes[i].Ptn[0]] = 1;
        //    }

        //    List<int> li = new List<int>();

        //    for (int i = 0; i < ptn.Items.Count; i++)
        //    {
        //        if (ptn.Items[i] < hash.Count && hash[ptn.Items[i]] == 1) li.Add(ptn.Items[i]);
        //    }

        //    return new Pattern(li, ptn.PtnCnt);
        // }

        public Pattern DeleteItems(Pattern ptn, HeadTable ht)
        {
            if (ht.HeadNodes.Count == 0) return new Pattern(new List<int>(), Int32.MaxValue);

            List<int> HeadTableItems = new List<int>();

            for (int i = 0; i < ht.HeadNodes.Count; i++)
            {
                HeadTableItems.Add(ht.HeadNodes[i].Ptn[0]);
            }

            List<int> li = new List<int>();

            for (int i = 0; i < ptn.Items.Count; i++)
            {
                if (HeadTableItems.Contains(ptn.Items[i])) li.Add(ptn.Items[i]);
            }

            return new Pattern(li, ptn.PtnCnt);
        }

        public void Insert(Node node, Pattern ptn, HeadTable headtable)
        {
            ptn = DeleteItems(ptn, headtable);

            if (ptn.Items.Count == 0) return;

            //sort pattern's items
            ptn.SortItems(headtable);

            //insert into tree
            for (int i = 0; i < node.Children.Count; i++)
            {
                if (node.Children[i].Ptn[0] == ptn[0])
                {
                    node.Children[i].Ptn.PtnCnt += ptn.PtnCnt;

                    Insert(node.Children[i], new Pattern(ptn.Items.GetRange(1, ptn.Items.Count - 1), ptn.PtnCnt), headtable);

                    return;
                }
            }

            Node newnode = new Node(new Pattern(new List<int>() { ptn[0] }, ptn.PtnCnt), node);
            node.Children.Add(newnode);

            //update headtable new node link
            newnode.Next = headtable.HeadNodes[headtable.Index[ptn[0]]].FirstNode;
            headtable.HeadNodes[headtable.Index[ptn[0]]].FirstNode = newnode;

            //recursive
            Insert(newnode, new Pattern(ptn.Items.GetRange(1, ptn.Items.Count - 1).ToList(), ptn.PtnCnt), headtable);
        }

        public FPTree BuildTree(List<Pattern> ptns)
        {
            FPTree fptree = Preproccess(ptns);

            foreach (Pattern ptn  in ptns)
            {
                Insert(fptree.Root, ptn, fptree.HeadTable);
            }

            return fptree;
        }

        public List<Node> SinglePath(Node T)
        {
            List<Node> ln;

            if (T.Children.Count == 0)
                return new List<Node>() { T };
            else if (T.Father != null && T.Children.Count == 1 && (ln = SinglePath(T.Children[0])) != null)
                return new List<Node>() { T }.Concat(ln).ToList();
            else if (T.Father == null && T.Children.Count == 1 && (ln = SinglePath(T.Children[0])) != null)
                return ln;
            else
                return null;
        }

        public void Generate(List<Pattern> lp, List<Node> curln, List<Node> ln, int i, int n)
        {
            if (i == n)
            {
                if (curln.Count == 0) return ;
                if (curln.Select(x => x.Ptn.PtnCnt).Min() >= MinSupportInt)
                    lp.Add(new Pattern(curln.Select(x => x.Ptn[0]).ToList(), curln.Select(x => x.Ptn.PtnCnt).Min()));
            }
            else
            {
                curln.Add(ln[i]);
                Generate(lp, curln, ln, i + 1, n);
                curln.Remove(ln[i]);
                Generate(lp, curln, ln, i + 1, n);
            }
        }

        public List<Pattern> Combination(List<Node> ln)
        {
            List<Pattern> lp = new List<Pattern>();

            Generate(lp, new List<Node>(), ln, 0, ln.Count);

            return lp;
        }

        public List<Pattern> ConcatPatterns(Pattern a, List<Pattern> b)
        {
            List<Pattern> lp = new List<Pattern>();

            for (int i = 0; i < b.Count; i++)
            {
                lp.Add(new Pattern(b[i].Items.Concat(a.Items).ToList(), Math.Min(a.PtnCnt, b[i].PtnCnt)));
            }

            return lp;
        }

        public List<Pattern> ConstructCondPtnBase(FPTree tree, Pattern ptn)
        {
            HeadTable ht = tree.HeadTable;

            List<Pattern> CondPtnBase = new List<Pattern>();

            List<List<Node>> lln = new List<List<Node>>();

            Node ptr;

            for (Node pt = ht[ht.Index[ptn[0]]].FirstNode; pt != null; pt = pt.Next)
            {
                if (pt.Ptn != null)
                {
                    List<Node> ln = new List<Node>();
                    ptr = pt;

                    while (ptr != null)
                    {
                        ln.Add(ptr);

                        ptr = ptr.Father;
                    }

                    CondPtnBase.Add(new Pattern(ln.GetRange(1, ln.Count - 2).Select(x => x[0]).Reverse().ToList(), pt.Ptn.PtnCnt));
                }
            }

            CondPtnBase = CondPtnBase.Where(x => x.Items.Count > 0).ToList();

            return CondPtnBase;
        }

        public FPTree ConstructCondFPTree(List<Pattern> ptnbase)
        {
            return BuildTree(ptnbase);
        }

        public void GeneratePatterns(FPTree fptree, Pattern alpha)//FPGrowth
        {
            List<Pattern> betas;
            List<Node> path;

            if ((path = SinglePath(fptree.Root)) != null)
            {
                betas = Combination(path);
                Patterns = Patterns.Concat(ConcatPatterns(alpha, betas)).ToList();//add patterns
            }
            else
            {
                foreach (HeadNode a in fptree.HeadTable)
                {
                    List<int> p = a.Ptn.Items;

                    Patterns.Add(new Pattern(p.Concat(alpha.Items).ToList(), a.Ptn.PtnCnt));//add patterns

                    Pattern beta = new Pattern(p.Concat(alpha.Items).ToList(), a.Ptn.PtnCnt);

                    List<Pattern> CondPtnBase = ConstructCondPtnBase(fptree, beta);

                    FPTree t = ConstructCondFPTree(CondPtnBase);

                    GeneratePatterns(t, beta);
                }
            }
        }

        public void GenerateL()
        {
            if (Patterns.Count == 0) return;

            int len = Patterns.Max(x => x.Items.Count);

            for (int i = 0; i < len; i++)
            {
                L.Add(new List<Item>());
            }

            for (int i = 0; i < Patterns.Count; i++)
            {
                L[Patterns[i].Items.Count - 1].Add(new Item(Patterns[i].Items, Patterns[i].PtnCnt));
            }
        }
    }
}