using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;

namespace AprioriAlgorithm.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            var lists = new List<List<int>> {
            new List<int> { 1,2,5 },
            new List<int> { 2, 4 },
            new List<int> { 2, 3 },
            new List<int> { 1, 2, 4 },
            new List<int> { 1, 3 },
            new List<int> { 2, 3 },
            new List<int> { 1, 3 },
            new List<int> { 1, 2, 3, 5 },
            new List<int> { 1, 2, 3 },
        };

            var fpGrowth = new FPGrowth(lists, 0.3);

            var listPattern = new List<Pattern> {
                new Pattern(new List<int> { 7,6,6,2,2}, 2)
            };

            
            var tree = fpGrowth.BuildTree(listPattern);

            var fpTree = new FPTree();
            var pat = new Pattern();

            fpGrowth.GeneratePatterns(fpTree, pat);

            fpGrowth.GenerateL();
            return View();
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}
